var LiteralTracer = require('../lib/LiteralTracer.js');
var testTracer = new LiteralTracer.Tracer();

describe("For literal assignments" , function() {
    describe("given a line of code that assigns a literal to a variable", function() {
        it("returns an object with the literal accessible by its variable name", function() {
            expect(testTracer.trace("var something = [4, 3, 6];").tracedValueFor('something')).toEqual([4, 3, 6]);
            expect(testTracer.trace("var someInt = 6;").tracedValueFor('someInt')).toEqual(6);
            expect(testTracer.trace("var someObj = {foo: 'bar'};").tracedValueFor('someObj')).toEqual({foo: "bar"});
            expect(testTracer.trace("var someChar = 'x';").tracedValueFor('someChar')).toEqual('x');
            expect(testTracer.trace("var someString = \"fooBar\";").tracedValueFor('someString')).toEqual("fooBar");
        });
    });

    describe("given a line of code with no variable assignment", function() {
        it("sets the variable to null", function() {
            expect(testTracer.trace("var someNothing;").tracedValueFor('someNothing')).toEqual(null);
        });
    });
    
    describe("given multiple literal assignments", function() {
        it("returns an object with the literals accessible by their variable names", function() {
            var source = "var someInt = 42;\nvar someString = 'asdf';\nvar someArray = ['a', 'b', 'c'];\n" +
                         "var someObj = {bar : 'baz'}";
            expect(testTracer.trace(source).tracedValueFor('someInt')).toEqual(42);
            expect(testTracer.trace(source).tracedValueFor('someString')).toEqual("asdf");
            expect(testTracer.trace(source).tracedValueFor('someArray')).toEqual(['a', 'b', 'c']);
            expect(testTracer.trace(source).tracedValueFor('someObj')).toEqual({ bar: "baz" });      
        });
    });
    
    describe("given multiple literal assignment after the same var statement", function() {
        it("returns an object with the literals accessible by their variable names", function() {
            var source = "var x = 5, y = 3;";
            expect(testTracer.trace(source).tracedValueFor('x')).toEqual(5);
            expect(testTracer.trace(source).tracedValueFor('y')).toEqual(3);
        });
        
        it("sets the uninitialized variables to null", function() {
            var source = "var x, y = 5;";
            expect(testTracer.trace(source).tracedValueFor('x')).toEqual(null);
            expect(testTracer.trace(source).tracedValueFor('y')).toEqual(5);
        });
    });

    describe("given object assignments", function() {
        it("can assign nested objects to the return object", function() {
            var source = "var a = { b : { foo : 'bar'}};"
            var result = testTracer.trace(source);

            expect(result.tracedValueFor('a').b).toEqual({foo : "bar"});
        });

        it("can assign assigned objects into objects", function() {
            var source = "var asdf = {}; var a = { b : asdf};"
            var result = testTracer.trace(source);

            expect(result.tracedValueFor('a').b).toEqual({});
        });
    });    
});

describe("For assignments of already initialized variables", function() {
    describe("given an assignment of a previously initialized variable", function() {
        it("assigns the new variable with the literal of the other variable", function() {
            var source = "var first = 'x';\nvar second = first;";
            var result = testTracer.trace(source);
            expect(result.tracedValueFor('first')).toEqual('x');
            expect(result.tracedValueFor('second')).toEqual('x');
        });
        it("assigns variables transitive", function() {
            var source = "var first = 42;\nvar second = first;\nvar third = second;";
            var result = testTracer.trace(source);
            expect(result.tracedValueFor('first')).toEqual(42);
            expect(result.tracedValueFor('third')).toEqual(result.tracedValueFor('first'));
        });
    });
    
    describe("when there is a variable assignment", function() {
        it("sets the new value for the variable", function() {
            var source = "var a = 'a';\na = 'b';"
            var result = testTracer.trace(source);
            expect(result.tracedValueFor('a')).not.toEqual('a');
            expect(result.tracedValueFor('a')).toEqual('b');
        });
    
        it("sets all the values for multi assignments to a new variable", function() {
            var source = "var a = 'a'\n;var e = 'e'\n; var b, c, d;\na = b = c = d = e;";
            var result = testTracer.trace(source);
            expect(result.tracedValueFor('e')).toEqual('e');
    
            expect(result.tracedValueFor('a')).toEqual('e');
            expect(result.tracedValueFor('b')).toEqual('e');
            expect(result.tracedValueFor('c')).toEqual('e');
            expect(result.tracedValueFor('d')).toEqual('e');
        });
    
        it("sets all the values for multi assignments to a new constant", function() {
            var source = "var a, b, c;\na = b = c = 42;";
            var result = testTracer.trace(source);
    
            expect(result.tracedValueFor('a')).toEqual(42);
            expect(result.tracedValueFor('b')).toEqual(42);
            expect(result.tracedValueFor('c')).toEqual(42);
        });
    });
        
    describe("when there are mixed assignments and declarations", function() {
        it("set them accordingly", function() {
            var source = "var a, b = 5, d, a = c = b;\n";
            var result = testTracer.trace(source);
    
            expect(result.tracedValueFor('a')).toEqual(5);
            expect(result.tracedValueFor('b')).toEqual(5);
            expect(result.tracedValueFor('c')).toEqual(5);
            expect(result.tracedValueFor('d')).toEqual(null);
        });
    });
});