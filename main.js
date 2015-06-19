
const _ = require('lodash');
const Q = require('q');
const fs = require('fs')
const express = require('express');
const bodyParser = require('body-parser');
const Passport = require('passport');
const TwitterStrategy = require('passport-twitter')
const session = require('express-session')

const db = require('./db')
const Tinsel = require('./tinsel')
const Sandbox = require('./sandbox')

const app = express();

Passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.TWITTER_SECRET,
  callbackURL: process.env.HOSTNAME + "/auth/twitter/callback"
}, (token, tokenSecret, profile, done) => {
  console.log("Logged in with Twitter user: ", profile.username);
  done(null, profile.username)
}));
Passport.serializeUser((uid, done) => done(null, uid));
Passport.deserializeUser((uid, done) => done(null, uid));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', express.static(__dirname + '/editor'));
app.use(session({ 
  secret: process.env.SESSION_SECRET, 
  saveUninitialized: false,
  resave: true}));
app.use(Passport.initialize());
app.use(Passport.session());

const server = app.listen(process.env.PORT || 3000);

//----------------------------------------
// Helpers
//----------------------------------------
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

function sandboxStory(username, story) {
  const storyPromise = db.loadStory(username, story);
  return Sandbox.sandboxedStory(storyPromise)
}

function sendResponse(text, res) {
  res.set('Content-Type', 'text/xml');
  console.log(text);
  res.send(text);
}

//----------------------------------------
// Authentication
//----------------------------------------
app.get('/auth/twitter', Passport.authenticate('twitter'), (req, res) => {});

app.get('/auth/twitter/callback', 
  Passport.authenticate('twitter', { failureRedirect: '/' }), (req, res) => {
    res.redirect("/stories")
  });

app.get('/logout', function(req, res){
  res.redirect('/');
});

//----------------------------------------
// Friendly URLs
//----------------------------------------
app.use('/', express.static(__dirname + '/editor/welcome.html'));
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


//----------------------------------------
// API
//----------------------------------------
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
  if (!req.user) {
    res.sendStatus(403)
    return
  }

  db.updateStory(req.user, req.body.story, req.body.data)
    .then((result) => res.sendStatus(200) )
    .catch((e) =>  {
      console.log("ERROR: ", e)
      res.sendStatus(500);
    });
});

app.post('/api/story/rename', (req, res) => {
  if (!req.user) { res.sendStatus(403); return }

  db.renameStory(req.user, req.body.oldName, req.body.newName)
    .then((result) => res.sendStatus(200))
    .catch((e) =>  {
      console.log("ERROR: ", e)
      res.sendStatus(500);
    });
});

app.post('/api/story/delete', (req, res) => {
  if (!req.user) { res.sendStatus(403); return }

  db.deleteStory(req.user, req.body.story)
    .then((result) => res.sendStatus(200))
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

//----------------------------------------
// Published Content
//----------------------------------------
app.get('/:username/:story/raw.js', (req, res) => {
  const storyPromise = db.loadStory(req.params.username, req.params.story);
  storyPromise.then((story) => {
    res.set('Content-Type', 'text/js');
    res.send(story.data);
  });
});

app.get('/:username/:story/', (req, res) => { 
  sandboxStory(req.params.username, req.params.story)
    .then((sandbox) => sandbox.story())
    .then((data) => {
      var state = "";
      if (req.query.state) {
        state = Tinsel.queryParamsForState(JSON.parse(req.query.state));
      }

      res.redirect("/" + req.params.username + "/" + req.params.story + "/" + data.start + state);
    });
});

app.get('/:username/:story/:node/', (req, res) => {
  console.log("Loading " + req.params.story)

  sandboxStory(req.params.username, req.params.story)
    .then((sandbox) => {
      return Q.all([sandbox.story(), Q(sandbox.script)]);
    }).spread((data, script) => {
      var state = req.query.state ? JSON.parse(req.query.state) : {};

      node = nodeAfterResolvingDigits(req.query.Digits, data.story, req.params.node);

      if (req.query.Digits) {
        state.Digits = req.query.Digits
      }

      Tinsel.renderNode(node, script, state).then( (xml) => {
        sendResponse(xml, res);
      });
    }).catch( (e) => console.log("ERROR: ", e));
});