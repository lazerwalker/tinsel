var script = {{SCRIPT}};

var functions = [];
for (nodeIndex in script.story) {
  var node = script.story[nodeIndex];
  var array = node.content;
  if (Array.isArray(array)) {
    for (i in array) {
      var item = array[i];
      if (item.type == "function" && typeof item["function"] == "function") {
        functions.push(item.function);
        item.functionCount = functions.length - 1;
      }
    }
  } else {
    if (typeof node.content == "function") {
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
    var result = functions[obj.functionCount](obj.opts)
    postMessage(JSON.stringify(result));
  }
}