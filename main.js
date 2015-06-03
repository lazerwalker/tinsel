var _ = require('lodash');

var fs = require('fs')
var data = JSON.parse(fs.readFileSync('example.json', 'utf8'));
var app = require('express')();
var server = app.listen(3000);

app.get('/:slug', function (req, res) {
  var node = _(data.story).findWhere({'name': req.params.slug});
  res.send(renderNode(node, res));
});

app.get('/', function(req, res) {
  var node = _(data.story).findWhere({'name': data.start});
  res.send(renderNode(node, res));
});

function renderNode(node) {
  return JSON.stringify(node);
}