var testTracer = require('../src/StaticTracer.js');

describe("StaticTracer", function() {
    it("accepts some source code", function() {
        testTracer.trace("var foo = 'bar'");
    });

    describe("when given a line of code that assigns a literal to a variable", function() {
        it("finds the variable and the literal for a string", function() {
            expect(testTracer.trace("var someString = 'foo';").variable).toEqual("someString");
            expect(testTracer.trace("var someString = 'foo';").literal).toEqual("foo");
        });
        it("finds the variable and the literal for a number", function() {
            expect(testTracer.trace("var someInt = 9;").variable).toEqual("someInt");

        });
    });
});
    
