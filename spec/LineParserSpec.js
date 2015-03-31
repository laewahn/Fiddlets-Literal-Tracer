var LineParser = require("../lib/LineParser");

describe("For functions called on some variable", function(){
	it("should return an array with the name of the variable and the name of the function for one function", function() {
		var source = "anArray.slice(1,2);\n";
		expect(LineParser.parse(source)).toEqual(["anArray", "slice"]);
	});

	it("should return an array with the name of the variable and the name of the function for more functions", function() {
		var source = "anArray.slice(1,2).map(addOne);\n";
		expect(LineParser.parse(source)).toEqual(["anArray", "slice", "map"]);
	});

	it("should return an array with the name of the variable and the name of the function if the call was on several lines", function() {
		var source = "anArray\n.slice(1,2)\n.map(addOne);\n";
		expect(LineParser.parse(source)).toEqual(["anArray", "slice", "map"]);
	});

	it("should return an array with the name of the variable and the name of the function if some function argument is a function", function() {
		var source = "anArray\n.slice(1,2)\n.map(function(n) {\nreturn n + 1;\n});\n";
		expect(LineParser.parse(source)).toEqual(["anArray", "slice", "map"]);

		source = "anArray.map(function(n) {\nreturn n + 1;\n}).slice(1,2);\n";
		expect(LineParser.parse(source)).toEqual(["anArray", "map", "slice"]);
	});
});

describe("For functions called on some literal", function() {
	it("should return an array with the initialized array and the name of the function for one function", function() {
		var source = "['a','b','c'].slice(1,2);\n";
		expect(LineParser.parse(source)).toEqual([['a','b','c'], "slice"]);
	});

	it("should return an array with the initialized string and the name of the function for one function", function() {
		var source = "'foobar'.indexOf('b');\n";
		expect(LineParser.parse(source)).toEqual(["foobar", "indexOf"]);
	});	
});