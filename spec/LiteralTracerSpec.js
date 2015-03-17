var LiteralTracer = require('../src/LiteralTracer.js');
var testTracer = new LiteralTracer.Tracer();

describe("For literal assignments" , function() {
    describe("given a line of code that assigns a literal to a variable", function() {
        it("returns an object with the literal accessible by its variable name", function() {
            expect(testTracer.trace("var something = [4, 3, 6];").something).toEqual([4, 3, 6]);
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

    describe("given object assignments", function() {
        it("can assign nested objects to the return object", function() {
            var source = "var a = { b : { foo : 'bar'}};"
            var result = testTracer.trace(source);

            expect(result.a.b).toEqual({foo : "bar"});
        });

        it("can assign assigned objects into objects", function() {
            var source = "var asdf = {}; var a = { b : asdf};"
            var result = testTracer.trace(source);

            expect(result.a.b).toEqual({});
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

    it("uses multiplication and division before plus and minus", function() {
        var source = "var a = 2 + 2 * 4;";
        expect(testTracer.trace(source).a).toEqual(10);
    });

    it("respects parenthesis", function() {
        var source = "var a = (2 + 2) * 4;";
        expect(testTracer.trace(source).a).toEqual(16);
    });
});

describe("when there are string constants", function() {
    it("allows for concatenation with other string constants", function() {
        var source = "var foo = 'foo'; var bar = 'bar'; var foobar = foo + bar";
        var result = testTracer.trace(source);

        expect(result.foo).toEqual("foo");
        expect(result.bar).toEqual("bar");
        expect(result.foobar).toEqual("foobar");
    });

    it("allows for concatenation with ints (which is that weird javascript thing..)", function() {
        var source = "var foo = 'foo'; var bar = 42; var foobar = foo + bar";
        var result = testTracer.trace(source);

        expect(result.foo).toEqual("foo");
        expect(result.bar).toEqual(42);
        expect(result.foobar).toEqual("foo42");
    });
});

describe("For objects", function() {
    it("preserves identity", function() {
        var source = "var a = {}; a.foo = 'bar'; var b = a; b.baz = 'asdf';"
        var result = testTracer.trace(source);
        expect(result.a).toEqual({ foo: 'bar', baz : 'asdf'});
        expect(result.a).not.toBe({});
        expect(result.b).toBe(result.b);
    });

    it("sets the properties using dot notation", function() {
        var source = "var a = {}; a.foo = 'bar'; var b = a; b.baz = 'asdf';"
        expect(testTracer.trace(source).a.foo).toEqual("bar");
        expect(testTracer.trace(source).a.baz).toEqual("asdf");
    });

    it("sets the properties using array notation with constants", function() {
        var source = "var a = {}; a['foo'] = 'bar';var b = a; b['baz'] = 'asdf';"
        expect(testTracer.trace(source).a.foo).toEqual("bar");
        expect(testTracer.trace(source).a.baz).toEqual("asdf"); 
    });

    it("sets the properties using array notation with variables", function() {
        var source = "var a = {}; var key = 'foo'; a[key] = 'bar'; key = 'baz';var b = a; b[key] = 'asdf';"
        expect(testTracer.trace(source).a.foo).toEqual("bar");
        expect(testTracer.trace(source).a.baz).toEqual("asdf"); 
    });

    it("sets the properties using array notation with properties of other objects", function() {
        var source = "var a = {}, b = { key : 'foo'}; a[b.key] = 'bar'; b.key = 'baz'; a[b.key] = 'asdf';"
        var result = testTracer.trace(source);

        expect(result.a.foo).toEqual("bar");
        expect(testTracer.trace(source).a.baz).toEqual("asdf"); 
    });

    it("can access chained propteries", function() {
        var source = "var a = { b : {}}; a.b.foo = 'bar'; a.b.baz = 'asdf'";
        var result = testTracer.trace(source);

        expect(result.a.b.foo).toEqual('bar');
        expect(result.a.b.baz).toEqual('asdf');
    });
})

describe("For variables in functions", function() {
    it("does not store them in the global scope", function() {
        var source = "function foo() {var a = 2;};";
        expect(testTracer.trace(source).a).toEqual(undefined);
    });

    it("does not override variables in global scope", function(){
        var source = "var a = 5; function foo() {var a = 2;};";
        expect(testTracer.trace(source).a).not.toEqual(2);
        expect(testTracer.trace(source).a).toEqual(5);
    });
});

describe("For function declarations", function() {
    it("stores the function", function() {
        var source = "function Cursor(){}";
        expect(testTracer.trace(source).Cursor).not.toBe(null);
    });

    it("can register the constructor on the prototype", function() {
        var source = "function Cursor(){}\nCursor.prototype.constructor = Cursor;";
        var result = testTracer.trace(source);

        expect(result.Cursor.prototype).not.toEqual(null);
        expect(result.Cursor.prototype.constructor).not.toEqual(null);
        expect(result.Cursor.prototype.constructor).toBe(result.Cursor);
    });

    it("can register members on the prorotype of the function", function() {
        var source = "function Cursor(){}\nCursor.prototype.constructor = Cursor;\nCursor.prototype.view = 'someView';";
        var result = testTracer.trace(source);

        expect(result.Cursor.prototype.view).toEqual('someView');
    });

    it("does not fail for functions declared as variables", function() {
        var source = "var someFunction = function() {var bar = 'asdf'}";
        var result = testTracer.trace(source);

        expect(result.someFunction).not.toBe(null);
        expect(typeof(result.someFunction)).toBe('function');
    });

    it("does not fail for functions declared as prototype members", function() {
        var source = "function Cursor(){}\nCursor.prototype.fnc = function() {};";
        var result = testTracer.trace(source);

        expect(result.Cursor.prototype.fnc).toBeDefined();
        expect(result.Cursor.prototype.fnc).not.toBe(null);
        expect(typeof(result.Cursor.prototype.fnc)).toBe('function');
    });
});

describe("For variable declarations inside functions", function() {
    it("should return a new scoped return object with the variables declared", function() {
        var source = "function foo() { var bar = 'asdf'; }";
        var result = testTracer.trace(source);

        expect(result.scopeByName('foo').bar).toEqual('asdf');
    });

    it("should return the scope for nested functions", function() {
        var source = "function foo() {\n function foo2() {\n var bar = 'asdf';\n}\n}";
        var result = testTracer.trace(source);
    
        expect(result.scopeByName('foo2').bar).toEqual('asdf'); 
    });

    it("should return null if the function can not be found", function() {
        var source = "function foo() {\n function foo2() {\n var bar = 'asdf';\n}\n}";
        var result = testTracer.trace(source);
        
        expect(result.scopeByName('asdf')).toBe(null);    
    });

    it("should have location information for the scopes", function() {
        var source =    "function foo() {\n" + 
                        "   function foo2() {\n" + 
                        "        var bar = 'asdf';\n" + 
                        "   }\n" + 
                        "}";

        var result = testTracer.trace(source);
    
        expect(result.scopeByName('foo').__location).not.toBe(undefined);
        expect(result.scopeByName('foo').__location).not.toBe(null);
    
        expect(result.scopeByName('foo').__location.start.line).toEqual(1);
        expect(result.scopeByName('foo').__location.end.line).toEqual(5);

        expect(result.scopeByName('foo2').__location.start.line).toEqual(2);
        expect(result.scopeByName('foo2').__location.end.line).toEqual(4);
    });

    it("should return the scope for a line", function() {
        var source =    "function foo() {\n" + 
                        "   function foo2() {\n" + 
                        "        var bar = 'asdf';\n" + 
                        "   }\n" + 
                        "}";

        var result = testTracer.trace(source);

        expect(result.scopeForLine(3)).not.toBe(undefined);
        expect(result.scopeForLine(100)).toBe(null);
        expect(result.scopeForLine(2)).toBe(result.scopeByName('foo'));
        expect(result.scopeForLine(3)).toBe(result.scopeByName('foo2'));
    });

    it("should create scopes for functions declared as variables", function() {
        var source = "var someFunction = function() {\n var bar = 'asdf';\n}";
        var result = testTracer.trace(source);

        expect(result.scopeByName('someFunction')).toBeDefined();
        expect(result.scopeByName('someFunction')).not.toBe(null);
        expect(result.scopeForLine(2)).toBe(result.scopeByName('someFunction'));
        expect(result.scopeForLine(2).bar).toEqual('asdf');
    });

    it("should create scopes for functions declared as prototype members", function() {
        var source = "function Cursor(){}\nCursor.prototype.fnc = function() {\n var bar = 'asdf'\n};";
        var result = testTracer.trace(source);

        expect(result.scopeForLine(3)).toBeDefined();
        expect(result.scopeForLine(3).bar).toEqual('asdf');
    });

    it("should make variables in the parent scope accessible", function() {
        var source =    "function foo() {\n" + 
                        "   var baz = 'blah';\n" +
                        "   function foo2() {\n" + 
                        "        var bar = 'asdf';\n" + 
                        "   }\n" + 
                        "}";
        var result = testTracer.trace(source);

        expect(result.tracedValueOf('bar', 4)).toEqual('asdf');
        expect(result.tracedValueOf('baz', 4)).toEqual('blah');
    });

    it("should access the first occurence of a variable in the scope if the variable is overridden", function() {
        var source =    "var baz = 'notBlah'\n" +
                        "function foo() {\n" + 
                        "   var baz = 'blah';\n" +
                        "   function foo2() {\n" + 
                        "        var bar = 'asdf';\n" + 
                        "   }\n" + 
                        "}";
        var result = testTracer.trace(source);
        
        expect(result.tracedValueOf('baz', 4)).toEqual('blah');
    });
});

it("blah", function() {
    var source = "function Cursor() {}; Cursor.prototype.constructor = Cursor; Cursor.prototype.view = undefined;\r\n\r\nCursor.prototype.startBlinking = function() {}/*\r\n\tvar that = this;\r\n\tsetInterval(function() {\r\n\t\tthat.hide();\r\n\t\tsetTimeout(function() {\r\n\t\t\tthat.show();\r\n\t\t}, 500);\r\n\t},1000)\r\n}\r\n\r\nCursor.prototype.show = function() {\r\n\tthis.view.css({opacity : 1.0});\r\n}\r\n\r\nCursor.prototype.hide = function() {\r\n\tthis.view.css({opacity : 0.0});\r\n}\r\n*/";
    // console.log(JSON.stringify(testTracer.trace(source), null, 2));
});