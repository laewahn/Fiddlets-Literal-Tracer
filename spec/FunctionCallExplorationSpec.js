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

describe("Lets build the algorithm for parsing some line of code into the function chain model!", function() {
	
	function functionChainFromLine(line) {
		var LineParser = require('../lib/LineParser');
		var parsedLine = LineParser.parse(line);
		var calls = [new fc.ObjectCall(parsedLine[0].name, parsedLine[0].value)];

		parsedLine.slice(1).forEach(function(fn) {
			calls.push(new fc.FunctionCall(fn.name, fn.params.map(function(e){return e.value})))
		});

		var chain = new fc.FunctionChain(calls);

		return chain;
	}

	it("should work for a chain on some literal", function() {
		var chain = functionChainFromLine("['a','b','c'].splice(1,2);\n");

		expect(function() {
			// expected output: ['b', 'c']
			var result = chain.executeUntil(1);
			expect(result).toEqual(['b', 'c']);
		}).not.toThrow();

		
		chain = functionChainFromLine("['a','b','c'].splice(1,2).reverse();\n");
		expect(function() {
			// expected output: ['c', 'b']
			var result = chain.executeUntil(2);
			expect(result).toEqual(['c', 'b']);
		}).not.toThrow();
	});
});