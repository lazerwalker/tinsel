const _ = require('lodash');
const Twilio = require('twilio');
const Sandbox = require('sandbox');
const Q = require('q');
const fs = require('fs')
const querystring = require('querystring');
const db = require('./db')
const express = require('express');
const bodyParser = require('body-parser');
const Passport = require('passport');
const TwitterStrategy = require('passport-twitter')
const session = require('express-session')

function getSandboxedStoryStructure(sandbox) {
  return runSandbox("tree", sandbox);
}

function runSandbox(message, sandbox) {
  const s = new Sandbox();
  var defer = Q.defer();
  s.run(sandbox);
  s.on('message', (result) => defer.resolve(result));
  s.postMessage(message);

  return defer.promise;
}

function queryParamsForState(state) {
  if (state == undefined || _(state).size() == 0) { return "" }
  return "?" + querystring.stringify({state:JSON.stringify(state)})
}

const app = express();


Passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.TWITTER_SECRET,
  callbackURL: process.env.HOSTNAME + "/auth/twitter/callback"
}, (token, tokenSecret, profile, done) => {
  console.log("Logged in with Twitter user: ", profile.username);
  done(null, profile.username)
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', express.static(__dirname + '/editor'));
app.use(session({ 
  secret: process.env.SESSION_SECRET, 
  saveUninitialized: false,
  resave: true}));
app.use(Passport.initialize());
app.use(Passport.session());

Passport.serializeUser((uid, done) => done(null, uid));
Passport.deserializeUser((uid, done) => done(null, uid));


const server = app.listen(process.env.PORT || 3000);

app.use('/', express.static(__dirname + '/editor/welcome.html'));

app.get('/auth/twitter', Passport.authenticate('twitter'), (req, res) => {});

app.get('/auth/twitter/callback', 
  Passport.authenticate('twitter', { failureRedirect: '/' }), (req, res) => {
    res.redirect("/stories")
  });

app.get('/logout', function(req, res){
  res.redirect('/');
});

function nodeAfterResolvingDigits(digits, story, nodeName) {
  var node = story[nodeName];
  node.name = nodeName;

  if (digits === undefined) return node;

  const newNodeName = node.routes[digits];
  const newNode = story[newNodeName];

  if (newNode) {
    node = newNode;
    nodeName = newNodeName;
  } else if (node.routes.any) {
    nodeName = node.routes.any;
    node = story[nodeName];
  } else if (node.routes.default) {
    nodeName = node.routes.default;
    node = story[nodeName];
  }

  node.name = nodeName;
  return node;
}

const sandboxPromise = Q.nfcall(fs.readFile, 'sandbox.js', 'utf8');
function sandboxedStory(username, story) {
  const storyPromise = db.loadStory(username, story);

  return Q.all([storyPromise, sandboxPromise])
    .spread((story, sandbox) => {
      console.log(story, sandbox);
      return Q(sandbox.replace("{{SCRIPT}}", story.data));
    });
}

app.get('/editor', (req, res) => {
  if (!req.user) {
    res.redirect("/")
    return
  }
  res.sendFile(__dirname + "/editor/editor.html")
});

app.get('/stories',  (req, res) => {
  if (!req.user) {
    res.redirect("/")
    return
  }
  res.sendFile(__dirname + "/editor/stories.html")
});

app.get('/api/stories', (req, res) => {
  console.log("Fetching stories", req.user)
  db.fetchStories(req.user)
    .then((result) => {
      const names = _(result)
        .pluck('name')
        .reject((name) => _.isNull(name))
        .value()
      res.json(names);
    });
});

app.post('/api/story', (req, res) => {
  if (req.body.username != req.user) {
    res.sendStatus(401)
    return
  }

  db.updateStory(req.user, req.body.story, req.body.data)
    .then((result) => res.sendStatus(200) )
    .catch((e) =>  {
      console.log("ERROR: ", e)
      res.sendStatus(500);
    });
});

app.get('/api/:story/raw.js', (req, res) => {
  if (req.user) {
    res.redirect("/" + req.user + "/" + req.params.story + "/raw.js");
  } else {
    res.sendStatus(401);
  }
});

app.get('/:username/:story/raw.js', (req, res) => {
  const storyPromise = db.loadStory(req.params.username, req.params.story);
  storyPromise.then((story) => {
    res.set('Content-Type', 'text/js');
    res.send(story.data);
  });
});

app.get('/:username/:story/', (req, res) => { 
  console.log("QUERY = " + req.query.state);
  sandboxedStory(req.params.username, req.params.story)
    .then((sandbox) => { 
      return getSandboxedStoryStructure(sandbox) })
    .then((data) => {
      var state = "";
      if (req.query.state) {
        state = queryParamsForState(JSON.parse(req.query.state));
      }

      res.redirect("/" + req.params.username + "/" + req.params.story + "/" + data.start + state);
    });
});

app.get('/:username/:story/:node/', (req, res) => {
  console.log("Loading " + req.params.story)

  sandboxedStory(req.params.username, req.params.story)
    .then((script) => {
      return Q.all([getSandboxedStoryStructure(script), Q(script)]);
    }).spread((data, script) => {
      var state = req.query.state ? JSON.parse(req.query.state) : {};

      node = nodeAfterResolvingDigits(req.query.Digits, data.story, req.params.node);

      if (req.query.Digits) {
        state.Digits = req.query.Digits
      }

      renderNode(node, script, state).then( (xml) => {
        sendResponse(xml, res);
      });
    }).catch( (e) => console.log("ERROR: ", e));
});

function renderNode(node, sandbox, state) {
  const response = new Twilio.TwimlResponse();

  function handleShorthand(content) {
    if (_.isString(content)) {
      var prefixWord;
      const testForShorthand = /(.*?):\s?(.*)/.exec(content);
      if (testForShorthand) { prefixWord = testForShorthand[1]; }
      if (["pause", "redirect", "play"].indexOf(prefixWord) != -1) {
        obj = {};
        obj.type = prefixWord;
        if (prefixWord === "pause") {
          obj["length"] = testForShorthand[2];
        } else {
          obj.text = testForShorthand[2];
        }
        return obj;
      }
    }
    return content;
  }

  // returns a promise containing a new node.content
  function unwrapFunctions(content, opts) {

    // input: content JSON or function that returns [content JSON, data]
    // output: promise containing [content JSON, data]
    function unwrapFunction(c) {
      if (c.type !== "function") return Q([handleShorthand(c), opts]);

      const defer = Q.defer();

      const message = JSON.stringify({
        functionCount: c.functionCount,
        opts: opts
      });
      runSandbox(message, sandbox).then((newContent) => {
        newContent = JSON.parse(newContent);
        defer.resolve([handleShorthand(newContent[0]), newContent[1]]);
      });
      return defer.promise;
    }

    if (_(content).isArray()) {
      const promises = content.map(unwrapFunction);
      return Q.all(promises);
    } else {
      return unwrapFunction(content).then((x) => {
        if (_(x[0]).isArray()) {
          return unwrapFunctions(x[0], x[1]);
        } else {
          return [x];                    
        }
      });
    }
  }

  return unwrapFunctions(node.content, state).then( (result) => {
    var newData = _.clone(state);

    function sayText(n) {
      function handleTuple(tuple) {
        var obj = tuple[0];

        if (_.isString(obj)) {
          n.say(obj);
          return;
        }

        var opts = _.clone(obj);
        delete opts.type

        if (obj.type === "pause") {
          n.pause(opts);
        } else if (obj.type === "redirect") {
          delete opts.text
          opts.method = "GET"
          n.redirect(obj.text + queryParamsForState(tuple[1]), opts);
        } else if (obj.type === "play") {
          delete opts.text
          n.play(obj.text, opts);
        } else {
          delete opts.text
          n.say(obj.text, opts)
        }
      }

      _.each(result, handleTuple);
    }

    const hasRedirect = _.detect(result, (tuple) => tuple[0]["type"] === "redirect");
    if (node.routes && !hasRedirect) {
      newData = result.reduce((currentData, tuple) => {
        return _.assign(currentData, tuple[1]);
      }, {});

      delete newData["Digits"]

      const defaultGatherOpts = {
        method: "GET",
        numDigits: 1,
        action: node.name + queryParamsForState(newData)
      };

      const gatherOptions = _.assign(defaultGatherOpts, node.gatherOptions);
      response.gather(gatherOptions, sayText);

      if (node.routes.timeout) {
        response.redirect(node.routes.timeout + queryParamsForState(newData), {method: "GET"})
      }
    } else {
      sayText(response);
    }

    return Q(response.toString());
  });
}

function sendResponse(text, res) {
  res.set('Content-Type', 'text/xml');
  console.log(text);
  res.send(text);
}