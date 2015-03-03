var testTracer = require('../src/StaticTracer.js');

describe("StaticTracer", function() {
    it("accepts some source code", function() {
        testTracer.trace("var foo = 'bar'");
    });

    describe("when given a line of code that assigns a literal to a variable", function() {
        it("returns an object that indexes the literal by its variable name", function() {
            expect(testTracer.trace("var something = [4, 3, 6];")).toEqual({something: [4, 3, 6]});
            expect(testTracer.trace("var someInt = 6;").someInt).toEqual(6);
            expect(testTracer.trace("var someObj = {foo: 'bar'};").someObj).toEqual({foo: "bar"});
            expect(testTracer.trace("var someChar = 'x';").someChar).toEqual('x');
            expect(testTracer.trace("var someString = \"fooBar\";").someString).toEqual("fooBar");
        });
    });

    describe("when given a line of code with no variable assignment", function() {
        it("sets the variable to null", function() {
            expect(testTracer.trace("var someNothing;").someNothing).toEqual(null);
        });
    });
});
    
