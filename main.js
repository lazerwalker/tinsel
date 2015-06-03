var fs = require('fs')
var data = JSON.parse(fs.readFileSync('example.json', 'utf8'))

var app = require('express').express();
var server = app.listen(3000)

app.get('/:slug', function (req, res) {
  res.send(req.params.slug);
});

