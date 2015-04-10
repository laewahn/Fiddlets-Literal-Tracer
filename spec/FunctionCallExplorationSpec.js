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
});