var foo = {
  "start": "first",
  "story": [
    { 
      "name": "first",
      "content": [
        {
          "text": "This is the first node",
          "voice": "alice",
          "language": "en"
        },
        {
          "type": "pause",
          "length": 2
        },
        {
          "type": "function",
          "function": function() {
            var foo = 5; 
            foo++; 
            return "This is a fn with value " + foo;
          }
        },
        {
          "type": "text",
          "text": "Please make a selection!",
          "voice": "man"
        }
      ],
      "routes": {
        "1": "second",
        "2": "third",
        "default": "default",
        "none": "none"
      },
      "gatherOptions": {
        "numDigits": 3,
        "finishOnKey": "*"
      }
    },
    {
      "name": "second",
      "content": "This is the second node"
    },
    {
      "name": "third",
      "content": "This is the third node"
    },
    {
      "name": "default",
      "content": "You entered something different?"
    },  
    {
      "name": "none",
      "content": "You didn't enter anything!"
    }
  ]
}

var functions = [];
for (nodeIndex in foo.story) {
  var node = foo.story[nodeIndex];
  var array = node.content;
  if (!Array.isArray(array)) {
    array = [array];
  }

  for (i in array) {
    var item = array[i];
    if (item.type == "function" && typeof item["function"] == "function") {
      functions.push(item.function);
      item.functionCount = functions.length - 1;
    }
  }
}

onmessage = function(message) {
  if (message === "tree") {
    postMessage(foo);
  } else {
    postMessage(functions[message]());
  }
}