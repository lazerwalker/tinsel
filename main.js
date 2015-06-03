var _ = require('lodash');
var Twilio = require('twilio');

var fs = require('fs')
var data = JSON.parse(fs.readFileSync('example.json', 'utf8'));
var app = require('express')();
var server = app.listen(3000);

app.get('/:slug', function (req, res) {
  var node = _(data.story).findWhere({'name': req.params.slug});

  res.set('Content-Type', 'text/html');
  res.send(renderNode(node));
});

app.get('/', function(req, res) {
  var node = _(data.story).findWhere({'name': data.start});

  res.set('Content-Type', 'text/html');
  res.send(renderNode(node));
});

function renderNode(node) {
  var resp = new Twilio.TwimlResponse();
  resp.say(node.content);
  return resp.toString();
}