const db = require("./db");
db.importFromDisk('lazerwalker', 'example')
  .then((result) => {
    console.log("Loaded example file"); 
    process.exit();
  }).catch((e) => {
    console.log("Error: " + e); 
    process.exit(1)
  })