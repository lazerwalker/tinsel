fs = require('fs')
fs.readFile('example.json', 'utf8', function (err,data) {
  console.log(JSON.parse(data));
});