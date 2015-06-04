const _ = require('lodash');
const Twilio = require('twilio');
const Sandbox = require('sandbox');
const Q = require('q');
const fs = require('fs')

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

    if (req.query["Digits"]) {
        const newNodeName = node.routes[req.query["Digits"]];
        const newNode = _(data.story).findWhere({'name': newNodeName});
        if (newNode) { node = newNode; }
    }

    renderNode(node, req.query).then( (xml) => {
        sendResponse(xml, res);
    });
});

app.get('/', (req, res) => {
    res.redirect("/" + data.start);
});

function renderNode(node, data) {
    const response = new Twilio.TwimlResponse();

    // returns a promise containing a new node.content
    function unwrapFunctions() {
        function unwrapFunction(content) {
            if (content.type !== "function") return Q(content);

            const defer = Q.defer();

            const message = JSON.stringify({
                functionCount: content.functionCount,
                opts: data
            });
            runSandbox(message, (newContent) => {
                defer.resolve(newContent);            
            });
            return defer.promise;
        }

        if (_(node.content).isArray()) {
            const promises = node.content.map(unwrapFunction);
            return Q.all(promises);
        } else {
            return unwrapFunction(node.content);
        }
    }

    return unwrapFunctions().then( (content) => {
        function sayText(n) {
            function handleObj(obj) {
                if (_.isArray(obj)) {
                    _.each(obj, function(o) { handleObj(o); });
                } else if (_.isString(obj)) {
                    n.say(obj);
                } else {
                    var opts = _.clone(obj);
                    delete opts.type

                    if (obj.type == "pause") {
                        n.pause(opts);
                    } else if (obj.type == "function") {
                        runSandbox(obj.functionCount, (m) => {
                            handleObj(m);            
                        });
                    } else {
                        delete opts.text
                        n.say(obj.text, opts)
                    }
                }
            }
            handleObj(content);
        }

        if (node.routes) {
            const defaultGatherOpts = {
                method: "GET",
                numDigits: 1
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