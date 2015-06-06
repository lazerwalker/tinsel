var expect = require("chai").expect,
    exec = require('child_process').exec,
    request = require('request')

describe("when using the example JSON file", function() {
    before(function(done) {
        exec('npm start');
        setTimeout(function() { done(); }, 1500);
    });

    it("should redirect the root to the start node", function(done) {
        request("http://localhost:3000/example/", function(error, response, body) {
            expect(body).to.exist;
            expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="1" action="first?bar=Sauerkraut"><Say voice="alice" language="en">This is the first node</Say><Pause length="2"></Pause><Say>The value of query param &apos;foo&apos; is undefined</Say><Say voice="man">Please make a selection!</Say></Gather></Response>');
            done();
        });
    });

    describe("when the content is a function", function() {
        context("when it's the root content", function(done) {
            it("should work if it returns a single bit of content", function(done) {
                request("http://localhost:3000/example/second?foo=Applesauce", function(error, response, body) {
                    expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="1" action="second?foo=Applesauce&amp;baz=Potato%20Salad"><Say voice="man">This is the second node. Foo is Applesauce</Say></Gather></Response>');
                    done();
                });
            });        

            it("should work if it returns an array of content", function(done) {
                request("http://localhost:3000/example/contentFnReturnsArray", function(error, response, body) {
                    expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Say>Hi</Say><Say>Mom</Say></Response>');
                    done();
                });
            });
        })

        it("should execute when it's part of a content array", function(done) {
            request("http://localhost:3000/example/first?foo=Applesauce", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="1" action="first?foo=Applesauce&amp;bar=Sauerkraut"><Say voice="alice" language="en">This is the first node</Say><Pause length="2"></Pause><Say>The value of query param &apos;foo&apos; is Applesauce</Say><Say voice="man">Please make a selection!</Say></Gather></Response>');
                done();
            });        
        });
    });

    describe("when passing parameters", function() {
        it("should persist through a Digit redirect", function(done) {
            request("http://localhost:3000/example/first?Digits=1&foo=Applesauce", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="1" action="second?foo=Applesauce&amp;baz=Potato%20Salad"><Say voice="man">This is the second node. Foo is Applesauce</Say></Gather></Response>');
                done();
            });        
        });

        it("should persist through a root redirect", function(done) {
            request("http://localhost:3000/example/?foo=Applesauce", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="1" action="first?foo=Applesauce&amp;bar=Sauerkraut"><Say voice="alice" language="en">This is the first node</Say><Pause length="2"></Pause><Say>The value of query param &apos;foo&apos; is Applesauce</Say><Say voice="man">Please make a selection!</Say></Gather></Response>');
                done();
            });        
        });

        it("should persist through a default redirect", function(done) {
            request("http://localhost:3000/example/default-params?a=B&Digits=10", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Say>A still equals B</Say></Response>');
                done();
            });
        });
    });

    describe("setting new parameters", function() {
        it("should work when the function is part of an array", function(done) {
            request("http://localhost:3000/example/first?foo=Applesauce", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="1" action="first?foo=Applesauce&amp;bar=Sauerkraut"><Say voice="alice" language="en">This is the first node</Say><Pause length="2"></Pause><Say>The value of query param &apos;foo&apos; is Applesauce</Say><Say voice="man">Please make a selection!</Say></Gather></Response>');
                done();
            });
        });

        it("should work when the function is the only content", function(done) {
            request("http://localhost:3000/example/second?foo=Applesauce", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="1" action="second?foo=Applesauce&amp;baz=Potato%20Salad"><Say voice="man">This is the second node. Foo is Applesauce</Say></Gather></Response>');
                done();
            });
        });
    });

    describe("specific Twiml features", function() {
        it("should work for 'pause'", function(done) {
            request("http://localhost:3000/example/pause", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Pause length="3"></Pause></Response>');
                done();
            });
        });

        it("should work for 'redirect'", function(done) {
            request("http://localhost:3000/example/redirect", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Redirect method="GET">first</Redirect></Response>');
                done();
            });
        });

        it("should work for 'play'", function(done) {
            request("http://localhost:3000/example/play", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Play loop="10">http://instantrimshot.com/rimshot.wav</Play></Response>');
                done();
            });
        });

        it("should respect gatherOptions", function(done) {
            request("http://localhost:3000/example/gatherOptions", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="3" action="gatherOptions?" finishOnKey="*"><Say>Enter 3 digits, then asterisk</Say></Gather></Response>');
                done();
            });
        });

        it("should redirect to a 'timeout' route after a timeout", function(done) {
            request("http://localhost:3000/example/timeout", function(error, response, body) {
                expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="1" action="timeout?"><Say>Don&apos;t press anything!</Say></Gather><Redirect method="GET">timeoutRoute</Redirect></Response>');
                done();
            });
        });
    });

    describe("routing to new input", function() {
        describe("entering a choice not specified", function() {
            context("when a default route has been specified", function() {
                it("should go to the default route", function(done) {
                    request("http://localhost:3000/example/default-defined?Digits=8", function(error, response, body) {
                        expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Say>You entered something different?</Say></Response>');
                        done();
                    });
                });
            });

            context("when there is no default route", function() {
                it("should stay on the same route", function(done) {
                    request("http://localhost:3000/example/default-undefined?Digits=8", function(error, response, body) {
                        expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="1" action="default-undefined?"><Say>You may only press 1</Say></Gather></Response>');
                        done();
                    });
                });
            });

            context("when there is an 'any' option", function() {
                it("should give precedence to named routes, keeping digits", function(done) {
                    request("http://localhost:3000/example/captureAny?Digits=1", function(error, response, body) {
                        expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Say>You pressed 1, which should equal 1</Say></Response>');
                        done();
                    });
                });

                it("should continue to that node, with input digits intact", function(done) {
                    request("http://localhost:3000/example/captureAny?Digits=1234", function(error, response, body) {
                        expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Say>You entered 1234</Say></Response>');
                        done();
                    });
                });
            });
        });
    });


    it("should respect gatherOptions", function(done) {
        request("http://localhost:3000/example/gatherOptions", function(error, response, body) {
            expect(body).to.equal('<?xml version="1.0" encoding="UTF-8"?><Response><Gather method="GET" numDigits="3" action="gatherOptions?" finishOnKey="*"><Say>Enter 3 digits, then asterisk</Say></Gather></Response>');
            done();
        });
    })
});
