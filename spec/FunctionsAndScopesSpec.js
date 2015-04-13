/*global require, describe, it, expect */

"use strict";

var LiteralTracer = require("../lib/LiteralTracer.js");
var testTracer = new LiteralTracer.Tracer();

describe("For global scope", function() {
    it("should create a scope with no parent", function() {
        var source = "var foo = 'foo';\nvar bar = 'bar';\n function foobar() {\n\treturn foo + bar;\n}";
        var result = testTracer.trace(source);

        expect(result.scopeForPosition(3,1).tracedValueFor("foo")).toEqual("foo");
        expect(result.scopeForPosition(3,1).tracedValueFor("bar")).toEqual("bar");
        expect(result.scopeForPosition(3,1).tracedValueFor("foobar")()).toEqual("foobar");

        expect(result.scopeForPosition(1,2).tracedValueFor("foo")).toEqual("foo");
        expect(result.scopeForPosition(1,2).tracedValueFor("bar")).toEqual("bar");
        expect(result.scopeForPosition(1,2).tracedValueFor("foobar")()).toEqual("foobar");
    });
});

describe("For variables in functions", function() {
    it("does not store them in the global scope", function() {
        var source = "function foo() {var a = 2;};";
        expect(testTracer.trace(source).tracedValueFor("a")).toEqual(undefined);
    });

    it("does not override variables in global scope", function(){
        var source = "var a = 5; function foo() {var a = 2;};";
        expect(testTracer.trace(source).tracedValueFor("a")).not.toEqual(2);
        expect(testTracer.trace(source).tracedValueFor("a")).toEqual(5);
    });
});

describe("For function declarations", function() {
    it("stores the function", function() {
        var source = "function Cursor(){}";
        expect(testTracer.trace(source).tracedValueFor("Cursor")).not.toBe(null);
    });

    it("can register the constructor on the prototype", function() {
        var source = "function Cursor(){}\nCursor.prototype.constructor = Cursor;";
        var result = testTracer.trace(source);

        expect(result.tracedValueFor("Cursor").prototype).not.toEqual(null);
        expect(result.tracedValueFor("Cursor").prototype.constructor).not.toEqual(null);
        expect(result.tracedValueFor("Cursor").prototype.constructor).toBe(result.tracedValueFor("Cursor"));
    });

    it("can register members on the prorotype of the function", function() {
        var source = "function Cursor(){}\nCursor.prototype.constructor = Cursor;\nCursor.prototype.view = 'someView';";
        var result = testTracer.trace(source);

        expect(result.tracedValueFor("Cursor").prototype.view).toEqual("someView");
    });

    it("does not fail for functions declared as variables", function() {
        var source = "var someFunction = function() {var bar = 'asdf'}";
        var result = testTracer.trace(source);

        expect(result.tracedValueFor("someFunction")).not.toBe(null);
        expect(typeof(result.tracedValueFor("someFunction"))).toBe("function");
    });

    it("does not fail for functions declared as prototype members", function() {
        var source = "function Cursor(){}\nCursor.prototype.fnc = function() {};";
        var result = testTracer.trace(source);

        expect(result.tracedValueFor("Cursor").prototype.fnc).toBeDefined();
        expect(result.tracedValueFor("Cursor").prototype.fnc).not.toBe(null);
        expect(typeof(result.tracedValueFor("Cursor").prototype.fnc)).toBe("function");
    });

    it("does not fail for declarations to this", function() {
        var source = "function Something() { \n\tthis.foo = 'bar'\n}";
        var result = testTracer.trace(source);

        expect(result.scopeByName("Something").tracedValueFor("foo")).toEqual("bar");
    });

    it("creates an executable function for functions with no arguments", function() {
        var source =    "function helloWorld() {\n" +
                        "   return \"Hello World\";" +
                        "}";
        var result = testTracer.trace(source);

        expect(result.tracedValueFor("helloWorld")()).toEqual("Hello World");

        source =    "function helloWorldBuilder() {\n" +
                    "   return function() { \n" +
                    "       return \"Hello World!\";\n" +
                    "   } \n" +
                    "}";

        var builder = testTracer.trace(source).tracedValueFor("helloWorldBuilder")();
        expect(builder()).toEqual("Hello World!");
    });

    it("creates an executable function for functions with arguments", function() {
        var source =    "function helloWorld(who) {\n" +
                        "   return \"Hello \" + who;" +
                        "}";
        expect(testTracer.trace(source).tracedValueFor("helloWorld")("Foo")).toEqual("Hello Foo");

        source =    "var helloWorld = function(who) {\n" +
                    "   return \"Hello \" + who;" +
                    "}";
        expect(testTracer.trace(source).tracedValueFor("helloWorld")("Foo")).toEqual("Hello Foo");

        source =    "function HelloWorld() {}; HelloWorld.prototype.hello = function(who) {\n" +
                    "   return \"Hello \" \n + who;" +
                    "}";
        expect(testTracer.trace(source).tracedValueFor("HelloWorld").prototype.hello("Foo")).toEqual("Hello Foo");
    });

    it("copies the literals from outside of the scope of the function into the function", function(){
        var source = "function a () { \r\n    var greeting = \"Hello \"; \r\n    function b (name) {\r\n        return greeting + name;\r\n    }\r\n}";
        var result = testTracer.trace(source);
        expect(result.scopeForPosition(2, 1).tracedValueFor("b")("world")).toEqual("Hello world");

        source = "var greeting = \"Hello \" ;\r\n function a () { \r\n    function b (name) {\r\n        return greeting + name;\r\n    }\r\n}";
        result = testTracer.trace(source);
        expect(result.scopeForPosition(3,1).tracedValueFor("b")("World")).toEqual("Hello World");
    });
});

describe("For variable declarations inside functions", function() {
    it("should return a new scoped return object with the variables declared", function() {
        var source = "function foo() { var bar = 'asdf'; }";
        var result = testTracer.trace(source);

        expect(result.scopeByName("foo").tracedValueFor("bar")).toEqual("asdf");
    });

    it("should return the scope for nested functions", function() {
        var source = "function foo() {\n function foo2() {\n var bar = 'asdf';\n}\n}";
        var result = testTracer.trace(source);
    
        expect(result.scopeByName("foo2").tracedValueFor("bar")).toEqual("asdf"); 
    });

    it("should return null if the function can not be found", function() {
        var source = "function foo() {\n function foo2() {\n var bar = 'asdf';\n}\n}";
        var result = testTracer.trace(source);
        
        expect(result.scopeByName("asdf").results).toBe(null);    
    });

    it("should have location information for the scopes", function() {
        var source =    "function foo() {\n" + 
                        "   function foo2() {\n" + 
                        "        var bar = 'asdf';\n" + 
                        "   }\n" + 
                        "}";

        var result = testTracer.trace(source);
    
        expect(result.scopeByName("foo").results.__location).not.toBe(undefined);
        expect(result.scopeByName("foo").results.__location).not.toBe(null);
    
        expect(result.scopeByName("foo").results.__location.start.line).toEqual(1);
        expect(result.scopeByName("foo").results.__location.end.line).toEqual(5);

        expect(result.scopeByName("foo2").results.__location.start.line).toEqual(2);
        expect(result.scopeByName("foo2").results.__location.end.line).toEqual(4);
    });

    it("should return the scope for a line", function() {
        var source =    "function foo() {\n" + 
                        "   function foo2() {\n" + 
                        "        var bar = 'asdf';\n" + 
                        "   }\n" + 
                        "}";

        var result = testTracer.trace(source);

        expect(result.scopeForPosition(3, 1).results).not.toBe(undefined);
        expect(result.scopeForPosition(2, 1).results).toBe(result.scopeByName("foo").results);
        expect(result.scopeForPosition(3, 1).results).toBe(result.scopeByName("foo2").results);
    });

    it("should create scopes for functions declared as variables", function() {
        var source = "var someFunction = function() {\n var bar = 'asdf';\n}";
        var result = testTracer.trace(source);

        expect(result.scopeByName("someFunction").results).toBeDefined();
        expect(result.scopeByName("someFunction").results).not.toBe(null);
        expect(result.scopeForPosition(2, 1).results).toBe(result.scopeByName("someFunction").results);
        expect(result.scopeForPosition(2, 1).tracedValueFor("bar")).toEqual("asdf");
    });

    it("should create scopes for functions declared as prototype members", function() {
        var source = "function Cursor(){}\nCursor.prototype.fnc = function() {\n var bar = 'asdf'\n};";
        var result = testTracer.trace(source);

        expect(result.scopeForPosition(3, 1).results).toBeDefined();
        expect(result.scopeForPosition(3, 1).tracedValueFor("bar")).toEqual("asdf");
    });

    it("should make variables in the parent scope accessible", function() {
        var source =    "function foo() {\n" + 
                        "   var baz = 'blah';\n" +
                        "   function foo2() {\n" + 
                        "        var bar = 'asdf';\n" + 
                        "   }\n" + 
                        "}";
        var result = testTracer.trace(source);

        expect(result.scopeForPosition(4, 1).tracedValueFor("bar")).toEqual("asdf");
        expect(result.scopeForPosition(4, 1).tracedValueFor("baz")).toEqual("blah");
    });

    it("should access the first occurence of a variable in the scope if the variable is overridden", function() {
        var source =    "var baz = 'notBlah';\n" +
                        "function foo() {\n" + 
                        "   var baz = 'blah';\n" +
                        "   function foo2() {\n" + 
                        "        var bar = 'asdf';\n" + 
                        "   }\n" + 
                        "}";
        var result = testTracer.trace(source);
        
        expect(result.scopeForPosition(4, 1).tracedValueFor("baz")).toEqual("blah");
    });
});

describe("For a given scope of a tracing result", function() {
    it("should give us all available variable assignments", function() {
        var source =    "var sth = 'sth';\n" +
                        "function foo() {\n" + 
                        "   var baz = 'blah';\n" +
                        "   function foo2() {\n" + 
                        "        var bar = 'asdf';\n" + 
                        "   }\n" + 
                        "}";
        var result = testTracer.trace(source).scopeForPosition(5, 1).allAssignments();
        
        expect(result.bar).toEqual("asdf");
        expect(result.baz).toEqual("blah");
        expect(result.sth).toEqual("sth");
        
        expect(result.__location).toBeUndefined();
        expect(result.__scopes).toBeUndefined();
        expect(result.__scopeName).toBeUndefined();

        result = testTracer.trace(source).scopeForPosition(3, 1).allAssignments();
        expect(result.bar).toBeUndefined();
        expect(result.baz).toEqual("blah");
        expect(result.sth).toEqual("sth");
    });
});

describe("For scopes defined in one line", function() {
    it("can access the scopes by line and column number", function() {
        var source = "var sth = 'sth';function foo() {var baz = 'blah';function foo2() {var bar = 'asdf';}}";
        var result = testTracer.trace(source).scopeForPosition(1,72).allAssignments();
        
        expect(result.bar).toEqual("asdf");
        expect(result.baz).toEqual("blah");
        expect(result.sth).toEqual("sth");
        
        expect(result.__location).toBeUndefined();
        expect(result.__scopes).toBeUndefined();
        expect(result.__scopeName).toBeUndefined();

        result = testTracer.trace(source).scopeForPosition(1, 47).allAssignments();
        expect(result.bar).toBeUndefined();
        expect(result.baz).toEqual("blah");
        expect(result.sth).toEqual("sth");
    });
});

describe("For multiline programs", function() {
    it("finds the right scope", function() {
        var source =    "var sth = 'sth';\n" +
                        "function foo() {\n" + 
                        "   var baz = 'blah';\n" +
                        "   function foo2() {\n" + 
                        "        var bar = 'asdf';\n" + 
                        "   }\n" + 
                        "}\n" +
                        "var blubb;\n\n\n";
        var result = testTracer.trace(source);

        expect(result.scopeForPosition(1,1).results.__scopeName).toBeUndefined();
        expect(result.scopeForPosition(1,1).tracedValueFor("sth")).toEqual("sth");
        
        expect(result.scopeForPosition(2,1).results.__scopeName).toBeUndefined();
        expect(result.scopeForPosition(2,15).results.__scopeName).toBeUndefined();
        expect(result.scopeForPosition(2,16).results.__scopeName).toEqual("foo");

        expect(result.scopeForPosition(4,1).results.__scopeName).toEqual("foo");
        expect(result.scopeForPosition(4,19).results.__scopeName).toEqual("foo");
        expect(result.scopeForPosition(4,20).results.__scopeName).toEqual("foo2");

        expect(result.scopeForPosition(5,4).results.__scopeName).toEqual("foo2");
        expect(result.scopeForPosition(6,3).results.__scopeName).toEqual("foo2");
        expect(result.scopeForPosition(6,4).results.__scopeName).toEqual("foo");

        expect(result.scopeForPosition(7,0).results.__scopeName).toEqual("foo");
        expect(result.scopeForPosition(7,1).results.__scopeName).toBeUndefined();
        expect(result.scopeForPosition(8,0).results.__scopeName).toBeUndefined();

        expect(result.scopeForPosition(10,0).results).not.toBe(null);
        expect(result.scopeForPosition(10,0).results).toBe(result.scopeForPosition(7,1).results);
    });
});