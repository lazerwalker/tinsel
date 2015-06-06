const _ = require('lodash');
const Twilio = require('twilio');
const Sandbox = require('sandbox');
const Q = require('q');
const fs = require('fs')
const querystring = require('querystring');

var data;
const script = fs.readFileSync('example.json', 'utf8');
const sandbox = fs.readFileSync('sandbox.js', 'utf8')
    .replace("{{SCRIPT}}", script);

function runSandbox(message, callback) {
    const s = new Sandbox();
    s.run(sandbox);
    s.on('message', callback);
    s.postMessage(message);
}

runSandbox("tree", (message) => {
    data = message;
});


const app = require('express')();
const server = app.listen(3000);

app.get('/:slug', (req, res) => {
    var node = _(data.story).findWhere({'name': req.params.slug});

    const digits = req.query["Digits"];
    if (digits) {
        var newNodeName = node.routes[digits];
        const newNode = _(data.story).findWhere({'name': newNodeName});
        if (newNode) { 
            node = newNode; 
        } else if (node.routes.default) {
            newNodeName = node.routes.default;
            node = _(data.story).findWhere({'name': newNodeName})
        }
    }

    renderNode(node, req.query).then( (xml) => {
        sendResponse(xml, res);
    });
});

app.get('/', (req, res) => {
    res.redirect("/" + data.start + "?" + querystring.stringify(req.query));
});

function renderNode(node, data) {
    const response = new Twilio.TwimlResponse();

    // returns a promise containing a new node.content
    function unwrapFunctions(content) {

        // input: content JSON or function that returns [content JSON, data]
        // output: promise containing [content JSON, data]
        function unwrapFunction(c) {
            if (c.type !== "function") return Q([c, data]);

            const defer = Q.defer();

            const message = JSON.stringify({
                functionCount: c.functionCount,
                opts: data
            });
            runSandbox(message, (newContent) => {
                defer.resolve(JSON.parse(newContent));  
            });
            return defer.promise;
        }

        if (_(content).isArray()) {
            const promises = content.map(unwrapFunction);
            return Q.all(promises);
        } else {
            return unwrapFunction(content).then((x) => {
                if (_(x[0]).isArray()) {
                    return unwrapFunctions(x[0]);
                } else {
                    return [x];                    
                }
            });
        }
    }

    return unwrapFunctions(node.content).then( (result) => {
        console.log("RESULT", result);
        var newData = _.clone(data);

        function sayText(n) {
            function handleTuple(tuple) {
                console.log("Handling tuple")
                var obj = tuple[0];

                if (_.isString(obj)) {
                    n.say(obj);
                    return;
                }

                var opts = _.clone(obj);
                delete opts.type

                if (obj.type === "pause") {
                    n.pause(opts);
                } else if (obj.type === "redirect") {
                    delete opts.text
                    opts.method = "GET"
                    n.redirect(obj.text, opts);
                } else if (obj.type === "play") {
                    delete opts.text
                    n.play(obj.text, opts);
                } else {
                    delete opts.text
                    n.say(obj.text, opts)
                }
            }

            _.each(result, handleTuple);
        }

        if (node.routes) {
            newData = result.reduce((currentData, tuple) => {
                return _.assign(currentData, tuple[1]);
            }, {});

            delete newData["Digits"]

            const defaultGatherOpts = {
                method: "GET",
                numDigits: 1,
                action: "/" + node.name + "?" + querystring.stringify(newData)
            };

            const gatherOptions = _.assign(defaultGatherOpts, node.gatherOptions);
            response.gather(gatherOptions, sayText);
        } else {
            sayText(response);
        }

        return Q(response.toString());
    });
}

function sendResponse(text, res) {
    res.set('Content-Type', 'text/xml');
    // console.log(text);
    res.send(text);
}