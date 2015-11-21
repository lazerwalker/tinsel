const _ = require('lodash')
const Q = require('q')
const querystring = require('querystring');
const Twilio = require('twilio')
const Sandbox = require('./sandbox')

function handleShorthand(content) {
  if (_.isString(content)) {
    var prefixWord;
    const testForShorthand = /(.*?):\s?(.*)/.exec(content);
    if (testForShorthand) { prefixWord = testForShorthand[1]; }
    if (["pause", "redirect", "play"].indexOf(prefixWord) != -1) {
      obj = {};
      obj.type = prefixWord;
      if (prefixWord === "pause") {
        obj["length"] = testForShorthand[2];
      } else {
        obj.text = testForShorthand[2];
      }
      return obj;
    } else if (["man", "woman", "alice"].indexOf(prefixWord) != -1) {
      obj = {};
      obj.type = "text";
      obj.voice = prefixWord;
      obj.text = testForShorthand[2];
      return obj;
    }
  }
  return content;
}

// returns a promise containing a new node.content
function unwrapFunctions(content, opts, sandbox) {

  // input: content JSON or function that returns [content JSON, data]
  // output: promise containing [content JSON, data]
  function unwrapFunction(c) {
    if (c.type !== "function" && !(c instanceof Function)) return Q([handleShorthand(c), opts]);

    const defer = Q.defer();

    const message = JSON.stringify({
      functionCount: c.functionCount,
      opts: opts
    });
    Sandbox.runSandbox(message, sandbox).then((newContent) => {
      newContent = JSON.parse(newContent);
      defer.resolve([handleShorthand(newContent[0]), newContent[1]]);
    });
    return defer.promise;
  }

  if (_(content).isArray()) {
    // We need to execute these sequentially so state mutation works properly with multiple sequential JS functions
    // TODO: There has to be a more functional way to do this.
    var promise = Q(undefined);
    var results = [];
    content.forEach(function(c) {
      promise = promise.then(function(result) {
        if (result) {
          results.push(result);
          opts = result[1];
        }
        return unwrapFunction(c);
      });
    });

    return promise.then(function(result) {
      if (result) results.push(result);
      return results;
    });

  } else {
    return unwrapFunction(content).then((x) => {
      if (_(x[0]).isArray()) {
        return unwrapFunctions(x[0], x[1]);
      } else {
        return [x];                    
      }
    });
  }
}

function sayText(result, response) {
  function handleTuple(tuple) {
    var obj = tuple[0];

    if (_.isString(obj)) {
      response.say(obj);
      return;
    }

    var opts = _.clone(obj);
    delete opts.type

    if (obj.type === "pause") {
      response.pause(opts);
    } else if (obj.type === "redirect") {
      delete opts.text
      opts.method = "GET"
      response.redirect(obj.text + queryParamsForState(tuple[1]), opts);
    } else if (obj.type === "play") {
      delete opts.text
      response.play(obj.text, opts);
    } else {
      delete opts.text
      response.say(obj.text, opts)
    }
  }

  _.each(result, handleTuple);
}

function queryParamsForState(state) {
  if (state == undefined || _(state).size() == 0) { return "" }
  return "?" + querystring.stringify({state:JSON.stringify(state)})
}

function renderNode(node, sandbox, state) {
  const response = new Twilio.TwimlResponse();

  return unwrapFunctions(node.content, state, sandbox).then( (result) => {
    var newData = _.clone(state);

    const hasRedirect = _.detect(result, (tuple) => tuple[0]["type"] === "redirect");
    if (node.routes && !hasRedirect) {
      newData = result.reduce((currentData, tuple) => {
        return _.assign(currentData, tuple[1]);
      }, {});

      delete newData["Digits"]

      const defaultRouteOpts = {
        method: "GET",
        numDigits: 1,
        action: node.name + queryParamsForState(newData)
      };

      const routeOptions = _.assign(defaultRouteOpts, node.routes.options);
      response.gather(routeOptions, (n) => sayText(result, n));

      if (node.routes.timeout) {
        response.redirect(node.routes.timeout + queryParamsForState(newData), {method: "GET"})
      }
    } else {
      sayText(result, response);
    }
    return Q(response.toString());
  });
}

module.exports = {
  queryParamsForState: queryParamsForState,
  renderNode: renderNode
}