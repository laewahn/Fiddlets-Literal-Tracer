/*global require, describe, it, expect */

"use strict";

var domainController = require("../LiteralTracerDomainController.js");

describe("When parsing a line", function() {
	it("should substitute identifiers with values of the previous trace", function() {
		var contextCode = "var anArray = ['a','b','c'];\n var index = 1;\nvar count = 2;\n function appendBla(v) { return \"bla_\" + v };\n";
		var line = "anArray.splice(index,count).map(appendBla).reverse();\n";

		domainController.traceCmd(contextCode + line, {line: 0, ch: 1});
		var result = domainController.elementsForLineCmd(line);

		expect(result.length).toBe(4);
		expect(result[0].value).toEqual(["a","b","c"]);
		expect(result[0].name).toEqual("anArray");
		expect(result[1].name).toEqual("splice");
		expect(result[2].name).toEqual("map");
		expect(result[3].name).toEqual("reverse");

		expect(result[1].params[0].value).toEqual(1);
		expect(result[1].params[1].value).toEqual(2);
	});
});

describe("When not completely executing a line", function(){
	it("should return the input and the result of every part of the execution", function() {
		var contextCode = "var anArray = ['a','b','c'];\n var index = 1;\nvar count = 2;\n function appendBla(v) { return \"bla_\" + v };\n";
		var line = "anArray.splice(index,count).map(appendBla).reverse();\n";

		domainController.traceCmd(contextCode + line, {line: 0, ch: 1});
		var result = domainController.executeLineUntilCmd(line, 3);

		expect(result).toBeDefined();
		expect(result.length).toBe(4);

		for(var i = 0; i < result.length; i++) {
			expect(result[i].input).toBeDefined("for result[" + i + "]");
			expect(result[i].returnValue).toBeDefined("for result[" + i + "]");
		}

		expect(result[0].returnValue).toEqual(["a","b","c"]);

		expect(result[1].input).toEqual(["a","b","c"]);
		expect(result[1].returnValue).toEqual(["b","c"]);

		expect(result[2].input).toEqual(["b","c"]);
		expect(result[2].returnValue).toEqual(["bla_b","bla_c"]);

		expect(result[3].input).toEqual(["bla_b","bla_c"]);
		expect(result[3].returnValue).toEqual(["bla_c","bla_b"]);
	});

	it("should return the input and the result of every part of the execution that was actually executed", function() {
		var contextCode = "var anArray = ['a','b','c'];\n var index = 1;\nvar count = 2;\n function appendBla(v) { return \"bla_\" + v };\n";
		var line = "anArray.splice(index,count).map(appendBla).reverse();\n";

		domainController.traceCmd(contextCode + line, {line: 0, ch: 1});
		var result = domainController.executeLineUntilCmd(line, 2);

		expect(result).toBeDefined();
		expect(result.length).toBe(3);

		for(var i = 0; i < result.length; i++) {
			expect(result[i].input).toBeDefined("for result[" + i + "]");
			expect(result[i].returnValue).toBeDefined("for result[" + i + "]");
		}

		expect(result[0].returnValue).toEqual(["a","b","c"]);

		expect(result[1].input).toEqual(["a","b","c"]);
		expect(result[1].returnValue).toEqual(["b","c"]);

		expect(result[2].input).toEqual(["b","c"]);
		expect(result[2].returnValue).toEqual(["bla_b","bla_c"]);
	});
});

describe("When executing any line", function() {
	it("should return the state of the original object", function() {
		var contextCode = "var anArray = ['a','b','c'];\n var index = 1;\nvar count = 2;\n function appendBla(v) { return \"bla_\" + v };\n";
		var line = "anArray.splice(index,count).map(appendBla).reverse();\n";		

		domainController.traceCmd(contextCode + line, {line: 0, ch: 1});

		var result = domainController.executeLineUntilCmd(line, 0);
		expect(result[0].originalValue).toEqual(['a','b','c']);

		result = domainController.executeLineUntilCmd(line, 1);
		expect(result[0].originalValue).toEqual(['a']);

		result = domainController.executeLineUntilCmd(line, 3);
		expect(result[0].originalValue).toEqual(['a']);
	});
});