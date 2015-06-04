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
            expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="3" action="/first?" finishOnKey="*"><Say voice="alice" language="en">This is the first node</Say><Pause length="2"></Pause><Say>The value of query param &apos;foo&apos; is undefined</Say><Say voice="man">Please make a selection!</Say></Gather></Response>');
            done();
        });
    });

    describe("when the content is a function", function(done) {
        it("should execute when it's the root content", function(done) {
            request("http://localhost:3000/second?foo=Applesauce", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="1" action="/second?foo=Applesauce"><Say>This is the second node. Foo is Applesauce</Say></Gather></Response>');
                done();
            });        
        })

        it("should execute when it's part of a content array", function(done) {
            request("http://localhost:3000/first?foo=Applesauce", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="3" action="/first?foo=Applesauce" finishOnKey="*"><Say voice="alice" language="en">This is the first node</Say><Pause length="2"></Pause><Say>The value of query param &apos;foo&apos; is Applesauce</Say><Say voice="man">Please make a selection!</Say></Gather></Response>');
                done();
            });        
        });
    });

    describe("when passing parameters", function(done) {
        it("should persist through a Digit redirect", function(done) {
            request("http://localhost:3000/first?Digits=1&foo=Applesauce", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="1" action="/second?foo=Applesauce"><Say>This is the second node. Foo is Applesauce</Say></Gather></Response>');
                done();
            });        
        });

        it("should persist through a root redirect", function(done) {
            request("http://localhost:3000/?foo=Applesauce", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="3" action="/first?foo=Applesauce" finishOnKey="*"><Say voice="alice" language="en">This is the first node</Say><Pause length="2"></Pause><Say>The value of query param &apos;foo&apos; is Applesauce</Say><Say voice="man">Please make a selection!</Say></Gather></Response>');
                done();
            });        
        });
    });

    describe("setting new parameters", function() {
        xit("should work when the function is part of an array", function(done) {
            request("http://localhost:3000/first?foo=Applesauce", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="3" action="/first?foo=Applesauce&bar=Sauerkraut" finishOnKey="*"><Say voice="alice" language="en">This is the first node</Say><Pause length="2"></Pause><Say>The value of query param &apos;foo&apos; is Applesauce</Say><Say voice="man">Please make a selection!</Say></Gather></Response>');
                done();
            });
        });

        xit("should work when the function is the only content", function(done) {
            request("http://localhost:3000/second?foo=Applesauce", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="1" action="/second?foo=Applesauce&baz=Potato%20Salad"><Say>This is the second node. Foo is Applesauce</Say></Gather></Response>');
                done();
            });
        });
    });
});
