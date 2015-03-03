var testTracer = require('../src/StaticTracer.js');

describe("StaticTracer", function() {
    it("accepts some source code", function() {
        testTracer.trace("var foo = 'bar'");
    });

    describe("when given a line of code that assigns a literal to a variable", function() {
        it("returns an object with the literal accessible by its variable name", function() {
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

    describe("when given multiple literal assignments", function() {
        it("returns an object with the literals accessible by their variable names", function() {
            var source = "var someInt = 42;\nvar someString = 'asdf';\nvar someArray = ['a', 'b', 'c'];\n" +
                         "var someObj = {bar : 'baz'}";
            expect(testTracer.trace(source).someInt).toEqual(42);
            expect(testTracer.trace(source).someString).toEqual("asdf");
            expect(testTracer.trace(source).someArray).toEqual(['a', 'b', 'c']);
            expect(testTracer.trace(source).someObj).toEqual({ bar: "baz" });      
        });
    });

    xdescribe("when given an assignment of a previously initialized variable", function() {
        it("assigns the new variable with the literal of the other variable", function() {
            var source = "var first = 'x';\nvar second = first;";
            expect(testTracer.trace(source).first).toEqual('x');
            expect(testTracer.trace(source).second).toEqual('x');
        });
    });
});
    
