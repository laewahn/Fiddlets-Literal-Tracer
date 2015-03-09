var testTracer = require('../src/LiteralTracer.js');

describe("For unsupported types", function() {
    it("throws an exception", function() {
        fail("How do I throws exception?");
    });
});

describe("For literal assignments" , function() {
    describe("given a line of code that assigns a literal to a variable", function() {
        it("returns an object with the literal accessible by its variable name", function() {
            expect(testTracer.trace("var something = [4, 3, 6];")).toEqual({something: [4, 3, 6]});
            expect(testTracer.trace("var someInt = 6;").someInt).toEqual(6);
            expect(testTracer.trace("var someObj = {foo: 'bar'};").someObj).toEqual({foo: "bar"});
            expect(testTracer.trace("var someChar = 'x';").someChar).toEqual('x');
            expect(testTracer.trace("var someString = \"fooBar\";").someString).toEqual("fooBar");
        });
    });

    describe("given a line of code with no variable assignment", function() {
        it("sets the variable to null", function() {
            expect(testTracer.trace("var someNothing;").someNothing).toEqual(null);
        });
    });
    
    describe("given multiple literal assignments", function() {
        it("returns an object with the literals accessible by their variable names", function() {
            var source = "var someInt = 42;\nvar someString = 'asdf';\nvar someArray = ['a', 'b', 'c'];\n" +
                         "var someObj = {bar : 'baz'}";
            expect(testTracer.trace(source).someInt).toEqual(42);
            expect(testTracer.trace(source).someString).toEqual("asdf");
            expect(testTracer.trace(source).someArray).toEqual(['a', 'b', 'c']);
            expect(testTracer.trace(source).someObj).toEqual({ bar: "baz" });      
        });
    });
    
    describe("given multiple literal assignment after the same var statement", function() {
        it("returns an object with the literals accessible by their variable names", function() {
            var source = "var x = 5, y = 3;";
            expect(testTracer.trace(source).x).toEqual(5);
            expect(testTracer.trace(source).y).toEqual(3);
        });
        it("sets the uninitialized variables to null", function() {
            var source = "var x, y = 5;";
            expect(testTracer.trace(source).x).toEqual(null);
            expect(testTracer.trace(source).y).toEqual(5);
        });
    });
});

describe("For assignments of already initialized variables", function() {
    describe("given an assignment of a previously initialized variable", function() {
        it("assigns the new variable with the literal of the other variable", function() {
            var source = "var first = 'x';\nvar second = first;";
            var result = testTracer.trace(source);
            expect(result.first).toEqual('x');
            expect(result.second).toEqual('x');
        });
        it("assigns variables transitive", function() {
            var source = "var first = 42;\nvar second = first;\nvar third = second;";
            var result = testTracer.trace(source);
            expect(result.first).toEqual(42);
            expect(result.third).toEqual(result.first);
        });
    });
    
    describe("when there is a variable assignment", function() {
        it("sets the new value for the variable", function() {
            var source = "var a = 'a';\na = 'b';"
            var result = testTracer.trace(source);
            expect(result.a).not.toEqual('a');
            expect(result.a).toEqual('b');
        });
    
        it("sets all the values for multi assignments to a new variable", function() {
            var source = "var a = 'a'\n;var e = 'e'\n; var b, c, d;\na = b = c = d = e;";
            var result = testTracer.trace(source);
            expect(result.e).toEqual('e');
    
            expect(result.a).toEqual('e');
            expect(result.b).toEqual('e');
            expect(result.c).toEqual('e');
            expect(result.d).toEqual('e');
        });
    
        it("sets all the values for multi assignments to a new constant", function() {
            var source = "var a, b, c;\na = b = c = 42;";
            var result = testTracer.trace(source);
    
            expect(result.a).toEqual(42);
            expect(result.b).toEqual(42);
            expect(result.c).toEqual(42);
        });
    });
        
    describe("when there are mixed assignments and declarations", function() {
        it("set them accordingly", function() {
            var source = "var a, b = 5, d, a = c = b;\n";
            var result = testTracer.trace(source);
    
            expect(result.a).toEqual(5);
            expect(result.b).toEqual(5);
            expect(result.c).toEqual(5);
            expect(result.d).toEqual(null);
        });
    });
});


describe("when there is a mathematical computation that does not use any functions", function() {
    it("set the variable to the calculated result for simple calculations", function(){
        var source = "var a = 7 * 6;";
        expect(testTracer.trace(source).a).toEqual(42);

        source = "var a = 6; var b = 7 * a;";
        var result = testTracer.trace(source);
        expect(result.a).toEqual(6);
        expect(result.b).toEqual(42);

        source = "var a = 6; var b = a * 7;";
        result = testTracer.trace(source);
        expect(result.a).toEqual(6);
        expect(result.b).toEqual(42);

        source = "var a = 6; var b = 7; var c = a * b;";
        result = testTracer.trace(source);
        expect(result.a).toEqual(6);
        expect(result.b).toEqual(7);
        expect(result.c).toEqual(42);

        source = "var a = 6; var b = 7; var c = a + b;";
        expect(testTracer.trace(source).c).toEqual(13);

        source = "var a = 6; var b = 7; var c = a - b;";
        expect(testTracer.trace(source).c).toEqual(-1);

        source = "var a = 8; var b = 2; var c = a / b;";
        expect(testTracer.trace(source).c).toEqual(4);

        source = "var a = 9; var b = 2; var c = a % b;";
        expect(testTracer.trace(source).c).toEqual(1);
    });

    it("set the variable to the calculated result for complex calculations", function(){
        var source = "var a = 2, b = 3, c = 4;var d = a * b * c;";
        var result = testTracer.trace(source);
        expect(result.a).toEqual(2);
        expect(result.b).toEqual(3);
        expect(result.c).toEqual(4);
        expect(result.d).toEqual(24);
    });
});