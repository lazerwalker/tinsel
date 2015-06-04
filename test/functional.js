var expect = require("chai").expect,
    exec = require('child_process').exec,
    request = require('request')

describe("when using the example JSON file", function() {
    before(function(done) {
        exec('npm start');
        setTimeout(function() { done(); }, 1500);
    });

    it("should redirect the root to the start node", function(done) {
        request("http://localhost:3000/", function(error, response, body) {
            expect(body).to.exist;
            expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="3" finishOnKey="*"><Say voice="alice" language="en">This is the first node</Say><Pause length="2"></Pause><Say>The value of query param &apos;foo&apos; is undefined</Say><Say voice="man">Please make a selection!</Say></Gather></Response>');
            done();
        });
    });

    it("should pass through parameters to a sandboxed function", function(done) {
        request("http://localhost:3000/first?foo=Applesauce", function(error, response, body) {
            expect(body).to.exist;
            expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="3" finishOnKey="*"><Say voice="alice" language="en">This is the first node</Say><Pause length="2"></Pause><Say>The value of query param &apos;foo&apos; is Applesauce</Say><Say voice="man">Please make a selection!</Say></Gather></Response>');
            done();
        });        
    })

    xit("should pass params through in the case of a redirect", function(done) {
        request("http://localhost:3000/?foo=Applesauce", function(error, response, body) {
            expect(body).to.exist;
            expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="3" finishOnKey="*"><Say voice="alice" language="en">This is the first node</Say><Pause length="2"></Pause><Say>The value of query param &apos;foo&apos; is Applesauce</Say><Say voice="man">Please make a selection!</Say></Gather></Response>');
            done();
        });        
    })
});
