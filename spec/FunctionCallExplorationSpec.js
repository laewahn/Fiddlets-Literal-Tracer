var fc = require('../lib/FunctionCalling.js');

describe("For a splice call on an array", function() {
	it("should execute the method and return the return value", function() {
		var functionChain = new fc.FunctionChain([
			new fc.ObjectCall("", ['a', 'b', 'c']),
			new fc.FunctionCall("splice", [2])
			]);

		var result;
		expect(function() {
			result = functionChain.executeUntil(1);
		}).not.toThrow();

		expect(result).toEqual(['c']);
		expect(functionChain.calls[0].object).toEqual(['a', 'b']);
	});

	it("should be able to only 'execute' the object and return its value", function() {
		var functionChain = new fc.FunctionChain([
			new fc.ObjectCall("", ['a', 'b', 'c']),
			new fc.FunctionCall("splice", [2])
			]);

		var result;
		expect(function() {
			result = functionChain.executeUntil(0);
		}).not.toThrow();

		expect(result).toEqual(['a', 'b', 'c']);
	});
});

describe("For a larger chained call on an array", function() {
	it("should execute all methods and return the return value", function() {
		var functionChain = new fc.FunctionChain([
			new fc.ObjectCall("", ['a', 'b', 'c']),
			new fc.FunctionCall("splice", [2]),
			new fc.FunctionCall("map",[function(e){return "_" + e + "_"}])
			]);

		var result;
		expect(function() {
			result = functionChain.executeUntil(2);
		}).not.toThrow();

		expect(result).toEqual(['_c_']);
		expect(functionChain.calls[0].object).toEqual(['a', 'b']);
	});
});

describe("Given an algorithm to build a function chain from a line of code", function() {
	it("should work for a chain on some literal", function() {
		var chain = fc.functionChainFromLine("['a','b','c'].splice(1,2);\n");

		expect(function() {
			// expected output: ['b', 'c']
			var result = chain.executeUntil(1);
			expect(result).toEqual(['b', 'c']);
		}).not.toThrow();

		
		chain = fc.functionChainFromLine("['a','b','c'].splice(1,2).reverse();\n");
		expect(function() {
			// expected output: ['c', 'b']
			var result = chain.executeUntil(2);
			expect(result).toEqual(['c', 'b']);
		}).not.toThrow();
	});

	var LiteralTracer = require("../lib/LiteralTracer");
	it("should substitute a missing value for the first element with the value from a given static trace", function() {
		var tracer = new LiteralTracer.Tracer();

		var contextCode = "var anArray = ['a','b','c']\n";
		var contextAssignments = tracer.trace(contextCode).allAssignments();

		expect(function() {
			var chain = fc.functionChainFromLine("anArray.splice(1,2);\n", contextAssignments);
			expect(chain.calls[0].object).toEqual(['a','b','c']);

			var result = chain.executeUntil(1);
			expect(result).toEqual(['b', 'c']);
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
			expect(result).toEqual(['b', 'c']);
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
			expect(result).toEqual(['bla_b', 'bla_c']);
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
			expect(chain.calls[2].unprocessedInput).toEqual(['b', 'c']);
			expect(chain.calls[3].unprocessedInput).toEqual(['bla_b', 'bla_c']);
			expect(result).toEqual(['bla_c', 'bla_b']);
		}).not.toThrow();
	});
});