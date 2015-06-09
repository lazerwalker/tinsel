const db = require("./db");
db.importFromDisk('lazerwalker', 'example')
  .then((result) => console.log("Loaded example file"))
  .catch((e) => console.log("Error: " + e))