const Q = require('q');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');

const url = process.env.MONGOLAB_URI || "mongodb://localhost:27017/"
console.log(url);

const dbPromise = Q.nfcall(MongoClient.connect, url);

exports.importFromDisk = (username, filename) => {
  const filePromise = Q.nfcall(fs.readFile, filename + '.json', 'utf8');

  return Q.all([dbPromise, filePromise]).spread((db, file) => {
    return exports.updateStory(username, filename, file);
  });
}

exports.loadStory = (username, filename) => {
  return dbPromise.then((db) => {
    const collection = db.collection(username);
    return Q.ninvoke(collection, "findOne", {name: filename});
  });
}

exports.fetchStories = (username) => {
  return dbPromise.then((db) => {
    const collection = db.collection(username);
    return Q.ninvoke(collection, "find")
      .then((stories) => Q.ninvoke(stories, "toArray"))
  });
}

exports.createStory = (username, filename) => {
  return dbPromise.then((db) => {
    const collection = db.collection(username);
    return Q.ninvoke(collection, "insert", {name: filename});
  });
}

exports.updateStory = (username, filename, data) => {
   return dbPromise.then((db) => {
      const collection = db.collection(username);
      return Q.ninvoke(collection, "update", 
        {name: filename},
        {name: filename, data: data},
        {upsert: true}
      );
  }); 
}

exports.renameStory = (username, oldName, newName) => {
  return dbPromise.then((db) => {
    const collection = db.collection(username);
    return Q.ninvoke(collection, "update", 
      {name: oldName},
      {name: newName}
    );
  });
}

exports.removeStory = (username, filename) => {
  return dbPromise.then((db) => {
    const collection = db.collection(username);
    return Q.ninvoke(collection, "remove", {name: oldName});
  }); 
}