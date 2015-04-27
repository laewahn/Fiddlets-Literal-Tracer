/*global require, describe, it, expect */

"use strict";

var fc = require("../lib/FunctionCalling.js");

describe("For a splice call on an array", function() {
	it("should execute the method and return the return value", function() {
		var functionChain = new fc.FunctionChain([
			new fc.ObjectCall("", ["a", "b", "c"]),
			new fc.FunctionCall("splice", [2])
			]);

		var result;
		expect(function() {
			result = functionChain.executeUntil(1);
		}).not.toThrow();

		expect(result).toEqual(["c"]);
		expect(functionChain.calls[0].object).toEqual(["a", "b"]);
	});

	it("should be able to only 'execute' the object and return its value", function() {
		var functionChain = new fc.FunctionChain([
			new fc.ObjectCall("", ["a", "b", "c"]),
			new fc.FunctionCall("splice", [2])
			]);

		var result;
		expect(function() {
			result = functionChain.executeUntil(0);
		}).not.toThrow();

		expect(result).toEqual(["a", "b", "c"]);
	});
});

describe("For a larger chained call on an array", function() {
	it("should execute all methods and return the return value", function() {
		var functionChain = new fc.FunctionChain([
			new fc.ObjectCall("", ["a", "b", "c"]),
			new fc.FunctionCall("splice", [2]),
			new fc.FunctionCall("map",[function(e){return "_" + e + "_";}])
			]);

		var result;
		expect(function() {
			result = functionChain.executeUntil(2);
		}).not.toThrow();

		expect(result).toEqual(["_c_"]);
		expect(functionChain.calls[0].object).toEqual(["a", "b"]);
	});
});

describe("Given an algorithm to build a function chain from a line of code", function() {
	it("should work for a chain on some literal", function() {
		var chain = fc.functionChainFromLine("['a','b','c'].splice(1,2);\n");

		expect(function() {
			// expected output: ['b', 'c']
			var result = chain.executeUntil(1);
			expect(result).toEqual(["b", "c"]);
		}).not.toThrow();

		
		chain = fc.functionChainFromLine("['a','b','c'].splice(1,2).reverse();\n");
		expect(function() {
			// expected output: ['c', 'b']
			var result = chain.executeUntil(2);
			expect(result).toEqual(["c", "b"]);
		}).not.toThrow();
	});

	var LiteralTracer = require("../lib/LiteralTracer");
	it("should substitute a missing value for the first element with the value from a given static trace", function() {
		var tracer = new LiteralTracer.Tracer();

		var contextCode = "var anArray = ['a','b','c']\n";
		var contextAssignments = tracer.trace(contextCode).allAssignments();

		expect(function() {
			var chain = fc.functionChainFromLine("anArray.splice(1,2);\n", contextAssignments);
			expect(chain.calls[0].object).toEqual(["a","b","c"]);

			var result = chain.executeUntil(1);
			expect(result).toEqual(["b", "c"]);
		}).not.toThrow();
	});

	it("should substitute identifiers as parameters with values from the given static trace", function() {
		var tracer = new LiteralTracer.Tracer();

		var contextCode = "var anArray = ['a','b','c'];\n var index = 1;\nvar count = 2;";
		var contextAssignments = tracer.trace(contextCode).allAssignments();

		expect(function() {
			var chain = fc.functionChainFromLine("anArray.splice(index,count);\n", contextAssignments);
			expect(chain.calls[1].args).toEqual([1,2]);

			var result = chain.executeUntil(1);
			expect(result).toEqual(["b", "c"]);
		}).not.toThrow();
	});

	it("should substitute functions with their implementation", function() {
		var tracer = new LiteralTracer.Tracer();

		var contextCode = "var anArray = ['a','b','c'];\n var index = 1;\nvar count = 2;\n function appendBla(v) { return \"bla_\" + v };";
		var contextAssignments = tracer.trace(contextCode).allAssignments();

		expect(function() {
			var chain = fc.functionChainFromLine("anArray.splice(index,count).map(appendBla);\n", contextAssignments);
			expect(typeof(chain.calls[2].args[0])).toEqual("function");

			var result = chain.executeUntil(2);
			expect(result).toEqual(["bla_b", "bla_c"]);
		}).not.toThrow();
	});

	it("should include the input for the last evaluated execution step", function() {
		var tracer = new LiteralTracer.Tracer();

		var contextCode = "var anArray = ['a','b','c'];\n var index = 1;\nvar count = 2;\n function appendBla(v) { return \"bla_\" + v };";
		var contextAssignments = tracer.trace(contextCode).allAssignments();

		expect(function() {
			var chain = fc.functionChainFromLine("anArray.splice(index,count).map(appendBla).reverse();\n", contextAssignments);
			expect(chain.calls[2].unprocessedInput).not.toBeDefined();

			var result = chain.executeUntil(3);
			expect(chain.calls[2].unprocessedInput).toEqual(["b", "c"]);
			expect(chain.calls[3].unprocessedInput).toEqual(["bla_b", "bla_c"]);
			expect(result).toEqual(["bla_c", "bla_b"]);
		}).not.toThrow();
	});

	it("should be able to use the empty string literal in the parameters", function() {
		var tracer = new LiteralTracer.Tracer();

		var contextCode = "var str = 'bla';\n";
		var line = "var chars = str.split('');\n";

		var contextAssignments = tracer.trace(contextCode + line).allAssignments();

		expect(function() {
			var chain = fc.functionChainFromLine(line, contextAssignments);
			
			expect(chain.calls[1].args).toBeDefined();
			expect(chain.calls[1].args[0]).toEqual("");
			
			var result = chain.executeUntil(1);
			expect(result).toEqual(['b', 'l', 'a']);
		}).not.toThrow();
	});
});

describe("For functions declared inside the scope", function() {

	it("should make those executable", function() {
		var LiteralTracer = require("../lib/LiteralTracer");
		var tracer = new LiteralTracer.Tracer();

		var contextCode = "var someString = 'bla';\nfunction addAwesomeness(s) {\nvar as = ' AWESOME ';\nreturn as + s + as\n}\n";
		var line = "addAwesomeness(someString).indexOf('a');\n";

		var contextAssignments = tracer.trace(contextCode + line).allAssignments();

		expect(function() {
 			var chain = fc.functionChainFromLine(line, contextAssignments);
 			var result = chain.executeUntil(1);
 			
 			expect(result).toEqual(11);
		}).not.toThrow();
	});

	it("should make those executable also on literals", function() {
		var LiteralTracer = require("../lib/LiteralTracer");
		var tracer = new LiteralTracer.Tracer();

		var contextCode = "function addAwesomeness(s) {\nvar as = ' AWESOME ';\nreturn as + s + as;\n}\n";
		var line = "addAwesomeness('bla').indexOf('a');\n";

		var contextAssignments = tracer.trace(contextCode + line).allAssignments();

		expect(function() {
 			var chain = fc.functionChainFromLine(line, contextAssignments);
 			var result = chain.executeUntil(1);
 			
 			expect(result).toEqual(11);
		}).not.toThrow();
	});

	it("should make those executable on the result of a function executed as a parameter", function() {
		var LiteralTracer = require("../lib/LiteralTracer");
		var tracer = new LiteralTracer.Tracer();

		var contextCode = 	"function addAwesomeness(s) {\nvar as = ' AWESOME ';\nreturn as + s + as;\n}\n" +
							"function addDashes(s) {\nreturn '---'+s+'---';\n}\n";
		var line = "addDashes(addAwesomeness('bla')).indexOf('a');\n";

		var contextAssignments = tracer.trace(contextCode + line).allAssignments();

		expect(function() {
 			var chain = fc.functionChainFromLine(line, contextAssignments);
 			var result = chain.executeUntil(1);
 			
 			expect(result).toEqual(14);
		}).not.toThrow();
	});

	it("should make those executable also on the result of some nested functions executed as a parameters", function() {
		var LiteralTracer = require("../lib/LiteralTracer");
		var tracer = new LiteralTracer.Tracer();

		var contextCode = 	"function addAwesomeness(s) {\nvar as = ' AWESOME ';\nreturn as + s + as;\n}\n" +
							"function addDashes(s) {\nreturn '---'+s+'---';\n}\n" +
							"function addMarks(s) {\nreturn '!!' + s + '!!'\n}\n";
		var line = "addMarks(addDashes(addAwesomeness('bla'))).indexOf('a');\n";

		var contextAssignments = tracer.trace(contextCode + line).allAssignments();

		expect(function() {
 			var chain = fc.functionChainFromLine(line, contextAssignments);
 			var result = chain.executeUntil(1);
 			
 			expect(result).toEqual(16);
 			expect(chain.executeUntil(0)).toEqual("!!--- AWESOME bla AWESOME ---!!");
 			expect(chain.calls[0].name).not.toEqual("addMarks");
 			expect(chain.calls[0].name).toEqual("[anonymous]");
		}).not.toThrow();
	});
});

describe("For computed assignments", function() {
	it("should ignore the assignment and just compute the righthand expression", function() {
		var LiteralTracer = require("../lib/LiteralTracer");
		var tracer = new LiteralTracer.Tracer();

		var contextCode = "var bla = 'bla'\n";
		var line = "var anIndex = bla.indexOf('a');\n";

		var contextAssignments = tracer.trace(contextCode + line).allAssignments();

		expect(function() {
 			var chain = fc.functionChainFromLine(line, contextAssignments);
 			var result = chain.executeUntil(1);
 			
 			expect(result).toEqual(2);
		}).not.toThrow();
	
	});
});
