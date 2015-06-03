var _ = require('lodash');
var Twilio = require('twilio');

var fs = require('fs')
var data = JSON.parse(fs.readFileSync('example.json', 'utf8'));
var app = require('express')();
var server = app.listen(3000);

app.get('/:slug', function (req, res) {
  var node = _(data.story).findWhere({'name': req.params.slug});

  if (req.query["Digits"]) {
    var newNodeName = node.routes[req.query["Digits"]];
    var newNode = _(data.story).findWhere({'name': newNodeName});
    if (newNode) { node = newNode; }
  }

  sendResponse(renderNode(node), res);
});

app.get('/', function(req, res) {
  res.redirect("/" + data.start);
});

function renderNode(node) {
  var response = new Twilio.TwimlResponse();

  function sayText(n) {
    n.say(node.content);
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

  return response.toString();
}

function sendResponse(text, res) {
  res.set('Content-Type', 'text/xml');
  console.log(text);
  res.send(text);
}