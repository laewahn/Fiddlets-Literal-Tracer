var LiteralTracer = require('../lib/LiteralTracer.js');
var testTracer = new LiteralTracer.Tracer();

describe("when there is a mathematical computation that does not use any functions", function() {
    it("set the variable to the calculated result for simple calculations", function(){
        var source = "var a = 7 * 6;";
        expect(testTracer.trace(source).tracedValueFor('a')).toEqual(42);

        source = "var a = 6; var b = 7 * a;";
        var result = testTracer.trace(source);
        expect(result.tracedValueFor('a')).toEqual(6);
        expect(result.tracedValueFor('b')).toEqual(42);

        source = "var a = 6; var b = a * 7;";
        result = testTracer.trace(source);
        expect(result.tracedValueFor('a')).toEqual(6);
        expect(result.tracedValueFor('b')).toEqual(42);

        source = "var a = 6; var b = 7; var c = a * b;";
        result = testTracer.trace(source);
        expect(result.tracedValueFor('a')).toEqual(6);
        expect(result.tracedValueFor('b')).toEqual(7);
        expect(result.tracedValueFor('c')).toEqual(42);

        source = "var a = 6; var b = 7; var c = a + b;";
        expect(testTracer.trace(source).tracedValueFor('c')).toEqual(13);

        source = "var a = 6; var b = 7; var c = a - b;";
        expect(testTracer.trace(source).tracedValueFor('c')).toEqual(-1);

        source = "var a = 8; var b = 2; var c = a / b;";
        expect(testTracer.trace(source).tracedValueFor('c')).toEqual(4);

        source = "var a = 9; var b = 2; var c = a % b;";
        expect(testTracer.trace(source).tracedValueFor('c')).toEqual(1);
    });

    it("set the variable to the calculated result for complex calculations", function(){
        var source = "var a = 2, b = 3, c = 4;var d = a * b * c;";
        var result = testTracer.trace(source);
        expect(result.tracedValueFor('a')).toEqual(2);
        expect(result.tracedValueFor('b')).toEqual(3);
        expect(result.tracedValueFor('c')).toEqual(4);
        expect(result.tracedValueFor('d')).toEqual(24);
    });

    it("uses multiplication and division before plus and minus", function() {
        var source = "var a = 2 + 2 * 4;";
        expect(testTracer.trace(source).tracedValueFor('a')).toEqual(10);
    });

    it("respects parenthesis", function() {
        var source = "var a = (2 + 2) * 4;";
        expect(testTracer.trace(source).tracedValueFor('a')).toEqual(16);
    });
});

describe("when there are string constants", function() {
    it("allows for concatenation with other string constants", function() {
        var source = "var foo = 'foo'; var bar = 'bar'; var foobar = foo + bar";
        var result = testTracer.trace(source);

        expect(result.tracedValueFor('foo')).toEqual("foo");
        expect(result.tracedValueFor('bar')).toEqual("bar");
        expect(result.tracedValueFor('foobar')).toEqual("foobar");
    });

    it("allows for concatenation with ints (which is that weird javascript thing..)", function() {
        var source = "var foo = 'foo'; var bar = 42; var foobar = foo + bar";
        var result = testTracer.trace(source);

        expect(result.tracedValueFor('foo')).toEqual("foo");
        expect(result.tracedValueFor('bar')).toEqual(42);
        expect(result.tracedValueFor('foobar')).toEqual("foo42");
    });
});

describe("For objects", function() {
    it("preserves identity", function() {
        var source = "var a = {}; a.foo = 'bar'; var b = a; b.baz = 'asdf';"
        var result = testTracer.trace(source);
        expect(result.tracedValueFor('a')).toEqual({ foo: 'bar', baz : 'asdf'});
        expect(result.tracedValueFor('a')).not.toBe({});
        expect(result.tracedValueFor('b')).toBe(result.tracedValueFor('b'));
    });

    it("sets the properties using dot notation", function() {
        var source = "var a = {}; a.foo = 'bar'; var b = a; b.baz = 'asdf';"
        expect(testTracer.trace(source).tracedValueFor('a').foo).toEqual("bar");
        expect(testTracer.trace(source).tracedValueFor('a').baz).toEqual("asdf");
    });

    it("sets the properties using array notation with constants", function() {
        var source = "var a = {}; a['foo'] = 'bar';var b = a; b['baz'] = 'asdf';"
        expect(testTracer.trace(source).tracedValueFor('a').foo).toEqual("bar");
        expect(testTracer.trace(source).tracedValueFor('a').baz).toEqual("asdf"); 
    });

    it("sets the properties using array notation with variables", function() {
        var source = "var a = {}; var key = 'foo'; a[key] = 'bar'; key = 'baz';var b = a; b[key] = 'asdf';"
        expect(testTracer.trace(source).tracedValueFor('a').foo).toEqual("bar");
        expect(testTracer.trace(source).tracedValueFor('a').baz).toEqual("asdf"); 
    });

    it("sets the properties using array notation with properties of other objects", function() {
        var source = "var a = {}, b = { key : 'foo'}; a[b.key] = 'bar'; b.key = 'baz'; a[b.key] = 'asdf';"
        var result = testTracer.trace(source);

        expect(result.tracedValueFor('a').foo).toEqual("bar");
        expect(testTracer.trace(source).tracedValueFor('a').baz).toEqual("asdf"); 
    });

    it("can access chained propteries", function() {
        var source = "var a = { b : {}}; a.b.foo = 'bar'; a.b.baz = 'asdf'";
        var result = testTracer.trace(source);

        expect(result.tracedValueFor('a').b.foo).toEqual('bar');
        expect(result.tracedValueFor('a').b.baz).toEqual('asdf');
    });
});