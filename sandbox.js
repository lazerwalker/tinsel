const fs = require('fs')
const Q = require('q')
const Sandbox = require('sandbox');


function sandboxedStoryStructure(sandbox) {
  return runSandbox("tree", sandbox);
}

function runSandbox(message, sandbox) {
  const s = new Sandbox();
  var defer = Q.defer();
  s.run(sandbox);
  s.on('message', (result) => defer.resolve(result));
  s.postMessage(message);

  return defer.promise;
}

const sandboxPromise = Q.nfcall(fs.readFile, 'sandbox-helper.js', 'utf8');
function sandboxedStory(storyPromise) {
  return Q.all([storyPromise, sandboxPromise])
    .spread((story, sandbox) => {
      const script = sandbox.replace("{{SCRIPT}}", story.data)
      return Q({
        script: script,
        story: () => { return sandboxedStoryStructure(script) },
        sendMessage: (message) => { return runSandbox(message, script) }
      });
    });
}


module.exports = {
  sandboxedStoryStructure: sandboxedStoryStructure, 
  runSandbox: runSandbox, 
  sandboxedStory: sandboxedStory
};