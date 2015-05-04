/*global require, describe, it, expect */

"use strict";

var LiteralTracer = require("../../lib/LiteralTracer.js");
var testTracer = new LiteralTracer.Tracer();

describe("Exploration tests", function() {
    it("Can parse the Cursor example code", function() {
        var source = "function Cursor (view) {\r\n\tthis.view = view;\r\n}\r\n\r\nCursor.prototype.constructor = Cursor;\r\nCursor.prototype.view = undefined;\r\n\r\nCursor.prototype.startBlinking = function() {\r\n\tvar that = this;\r\n\tsetInterval(function() {\r\n\t\tthat.hide();\r\n\t\tsetTimeout(function() {\r\n\t\t\tthat.show();\r\n\t\t}, 500);\r\n\t},1000)\r\n}\r\n\r\nCursor.prototype.show = function() {\r\n\tthis.view.css({opacity : 1.0});\r\n}\r\n\r\nCursor.prototype.hide = function() {\r\n\tthis.view.css({opacity : 0.0});\r\n}\r\n";
        var result;

        expect(function() {
            result = testTracer.trace(source);
        }).not.toThrow();

        expect(result.tracedValueFor("Cursor").prototype.startBlinking).toBeDefined();
        expect(result.scopeForPosition(13, 1).tracedValueFor("that")).toBeDefined();
        expect(result.scopeForPosition(13, 1).tracedValueFor("that")).toBe(result.scopeForPosition(9, 1).tracedValueFor("that"));
    });

    it("Can parse the exampe from the splice demo", function() {
        var result;
        expect(function() {
            var source = "function appendBla(entry) {\r\n    return entry + \"_bla\"\r\n}\r\n\r\nfunction prependFoo(value) {\r\n\treturn \"foo_\" + value\r\n};\r\n\r\nvar someValue = 0;\r\nvar index = 2;\r\nvar howMany = 1;\r\nvar anArray = [\"a\", \"b\", \"c\"];\r\nanArray.push(\"d\");";
            result = testTracer.trace(source);
        }).not.toThrow();

        var assignments = result.allAssignments();
        var mappedArray = assignments.anArray.map(assignments.appendBla);
        expect(mappedArray).toEqual(["a_bla", "b_bla", "c_bla"]);
    });
});