var script = {{SCRIPT}};

var functions = [];
for (nodeIndex in script.story) {
  var node = script.story[nodeIndex];
  var array = node.content;
  if (Array.isArray(array)) {
    for (i in array) {
      var item = array[i];
      if (item.type == "function" && item["function"] instanceof Function) {
        functions.push(item.function);
        item.functionCount = functions.length - 1;
      } else if (item instanceof Function) {
        functions.push(item);        
        // TODO: replacing an array element mid-iteration? BAD.
        array[i] = {
          type: "function",
          functionCount: functions.length - 1
        };
      }
    }
  } else {
    if (node.content instanceof Function) {
      functions.push(node.content);
      node.content = {
        type: "function",
        functionCount: functions.length - 1
      };
    }
  }
}

onmessage = function(message) {
  if (message === "tree") {
    postMessage(script);
  } else {
    var obj = JSON.parse(message);
    var context = obj.opts;
    context.helpers = script.helpers;

    var result = functions[obj.functionCount].bind(context)();
    delete context.helpers;
    
    postMessage(JSON.stringify([result, context]));
  }
}