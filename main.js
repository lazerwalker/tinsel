var _ = require('lodash');
var Twilio = require('twilio');
var Sandbox = require('sandbox');
var Q = require('q');
var fs = require('fs')

var data;
var file = fs.readFileSync('example.js', 'utf8');

function runSandbox(message, callback) {
  console.log("Running sandbox with " + message)
  var s = new Sandbox();
  s.run(file);
  s.on('message', callback);
  s.postMessage(message);
}

runSandbox("tree", function(message) {
  data = message;
});



var app = require('express')();
var server = app.listen(3000);

app.get('/:slug', function (req, res) {
  var node = _(data.story).findWhere({'name': req.params.slug});

  if (req.query["Digits"]) {
    var newNodeName = node.routes[req.query["Digits"]];
    var newNode = _(data.story).findWhere({'name': newNodeName});
    if (newNode) { node = newNode; }
  }

  renderNode(node).then(function(xml) {
    sendResponse(xml, res);
  });
});

app.get('/', function(req, res) {
  res.redirect("/" + data.start);
});

function renderNode(node) {
  var response = new Twilio.TwimlResponse();

  // returns a promise containing a new node.content
  function unwrapFunctions() {
    function unwrapFunction(content) {
      if (content.type !== "function") return Q(content);

      var defer = Q.defer();
      runSandbox(content.functionCount, function(newContent) {
        defer.resolve(newContent);            
      });
      return defer.promise;
    }

    if (_(node.content).isArray()) {
      var promises = node.content.map(unwrapFunction);
      return Q.all(promises);
    } else {
      return unwrapFunction(node.content);
    }
  }

  return unwrapFunctions().then(function (content) {
    function sayText(n) {
      function handleObj(obj) {
        if (_.isArray(obj)) {
          _.each(obj, function(o) { handleObj(o); });
        } else if (_.isString(obj)) {
          n.say(obj);
        } else {
          var opts = _.clone(obj);
          delete opts.type

          if (obj.type == "pause") {
            n.pause(opts);
          } else if (obj.type == "function") {
            runSandbox(obj.functionCount, function(m) {
              handleObj(m);            
            });
          } else {
            delete opts.text
            n.say(obj.text, opts)
          }
        }
      }
      handleObj(content);
    }

    if (node.routes) {
      var defaultGatherOpts = {
        method: "GET",
        numDigits: 1
      };

      var gatherOptions = _.assign(defaultGatherOpts, node.gatherOptions);
      response.gather(gatherOptions, sayText);

    } else {
      sayText(response);
    }

    return Q(response.toString());
  });
}

function sendResponse(text, res) {
  res.set('Content-Type', 'text/xml');
  // console.log(text);
  res.send(text);
}