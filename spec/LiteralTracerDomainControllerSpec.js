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

	it("should work for the real live example", function() {
		var testSource = 	"var y = \/*\"x\"*\/ \"xxxxxxxy\";\r\n" +
					"y;\r\n" + 
					"var bla = \"blu\" + \"bla\";\r\n" + 
					"var someValue = bla.indexOf(\'l\');\r\n" + 
					"var index = 2;\r\n" + 
					"var howMany = 1;\r\n" + 
					"var anArray = [\"a\", \"b\", \"c\", \"b\"];\r\n" + 
					"anArray.push(\"d\");\r\n" + 
					"var bbla = \"b_bla\";\r\n" + 
					"var newArry = anArray.slice(0,index).map(appendBla);\r\n" + 
					"[\"a\",\"b\",\"c\"].splice(2,3, \"x\").map(appendBla).reverse().indexOf(bbla);\r\n" + 
					"var x = appendBla(prependFoo(bla)).indexOf(\'blax\');\r\n" +
					"bla.indexOf(\'a\');\r\n" + 
					"[bla, bla].slice(1,2).map(uppercase);\r\n" +
					"var appendBla = function(entry) {\r\n" + 
					"\/\/\ty;\r\n" +
					"\treturn entry + \"_bla\"\r\n" + 
					"}\r\n" + 
					"\r\n" + 
					"function prependFoo(value) {\r\n" + 
					"\treturn \"foo_\" + value\r\n" + 
					"};" + 
					"function uppercase(string) {\r\n" + 
					"    return string.toUpperCase();\r\n" + 
					"};\r\n";

		domainController.traceCmd(testSource, {line: 0, ch: 1});

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
	it("should keep the name of the referenced object", function() {
		var contextCode = "var anArray = ['a','b','c'];\n var index = 1;\nvar count = 2;\n function appendBla(v) { return \"bla_\" + v };\n";
		var line = "anArray.splice(index,count).map(appendBla).reverse();\n";		

		domainController.traceCmd(contextCode + line, {line: 0, ch: 1});

		var result = domainController.executeLineUntilCmd(line, 0);
		expect(result[0].original.value).toEqual(["a","b","c"]);
		expect(result[0].original.name).toEqual("anArray");

		var result = domainController.executeLineUntilCmd(line, 3);
		expect(result[0].original.name).toEqual("anArray");
		expect(result[0].original.value).toEqual(["a","b","c"]);
		expect(result[1].original.value).toEqual(["a"]);
		expect(result[2].original.value).toEqual(["a"]);
		expect(result[3].original.value).toEqual(["a"]);
	});

	it("should keep the value of the anonymously initialized object", function() {
		var contextCode = "var index = 1;\nvar count = 2;\n function appendBla(v) { return \"bla_\" + v };\n";
		var line = "['a','b','c'].splice(index,count).map(appendBla).reverse();\n";		

		domainController.traceCmd(contextCode + line, {line: 0, ch: 1});

		var result = domainController.executeLineUntilCmd(line, 3);
		expect(result[0].original.name).toEqual("[anonymous]");
		expect(result[0].original.value).toEqual(["a","b","c"]);
		expect(result[1].original.value).toEqual(["a"]);
		expect(result[2].original.value).toEqual(["a"]);
		expect(result[3].original.value).toEqual(["a"]);
	});	
});