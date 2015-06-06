const _ = require('lodash');
const Twilio = require('twilio');
const Sandbox = require('sandbox');
const Q = require('q');
const fs = require('fs')
const querystring = require('querystring');

function runSandbox(message, sandbox, callback) {
    const s = new Sandbox();
    s.run(sandbox);
    s.on('message', callback);
    s.postMessage(message);
}

const app = require('express')();
const server = app.listen(process.env.PORT || 3000);

app.get('/:story/:node', (req, res) => {
    var data;
    const script = fs.readFileSync(req.params.story + '.json', 'utf8');
    const sandbox = fs.readFileSync('sandbox.js', 'utf8')
        .replace("{{SCRIPT}}", script);
        
    runSandbox("tree", sandbox, (data) => {
        var nodeName = req.params.node;

        var node = data.story[nodeName];

        const digits = req.query["Digits"];
        if (digits) {
            const newNodeName = node.routes[digits];
            const newNode = data.story[newNodeName];
            if (newNode) { 
                node = newNode; 
                nodeName = newNodeName;
            } else if (node.routes.any) {
                nodeName = node.routes.any;
                node = data.story[nodeName];
            } else if (node.routes.default) {
                nodeName = node.routes.default;
                node = data.story[nodeName];
            }
        }

        node.name = nodeName;

        renderNode(node, sandbox, req.query).then( (xml) => {
            sendResponse(xml, res);
        });
    });
});

app.get('/:story', (req, res) => {
    var data;
    const script = fs.readFileSync(req.params.story + '.json', 'utf8');
    const sandbox = fs.readFileSync('sandbox.js', 'utf8')
        .replace("{{SCRIPT}}", script);
        
    runSandbox("tree", sandbox, (data) => {
        res.redirect("/" + req.params.story + "/" + data.start + "?" + querystring.stringify(req.query));
    });
});

function renderNode(node, sandbox, data) {
    const response = new Twilio.TwimlResponse();

    // returns a promise containing a new node.content
    function unwrapFunctions(content, opts) {

        // input: content JSON or function that returns [content JSON, data]
        // output: promise containing [content JSON, data]
        function unwrapFunction(c) {
            if (c.type !== "function") return Q([c, opts]);

            const defer = Q.defer();

            const message = JSON.stringify({
                functionCount: c.functionCount,
                opts: opts
            });
            runSandbox(message, sandbox, (newContent) => {
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
                    return unwrapFunctions(x[0], x[1]);
                } else {
                    return [x];                    
                }
            });
        }
    }

    return unwrapFunctions(node.content, data).then( (result) => {
        var newData = _.clone(data);

        function sayText(n) {
            function handleTuple(tuple) {
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
                    const queryparams = "?" + querystring.stringify(tuple[1]);
                    n.redirect(obj.text + queryparams, opts);
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
                action: node.name + "?" + querystring.stringify(newData)
            };

            const gatherOptions = _.assign(defaultGatherOpts, node.gatherOptions);
            response.gather(gatherOptions, sayText);

            if (node.routes.timeout) {
                response.redirect(node.routes.timeout, {method: "GET"})
            }
        } else {
            sayText(response);
        }

        return Q(response.toString());
    });
}

function sendResponse(text, res) {
    res.set('Content-Type', 'text/xml');
    console.log(text);
    res.send(text);
}