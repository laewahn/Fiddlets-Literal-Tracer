var LineParser = require("../lib/LineParser");

describe("For functions called on some variable", function(){
	it("should return an array with the name of the variable and the name of the function for one function", function() {
		var source = "anArray.slice(1,2);\n";
		var result = LineParser.parse(source);

		expect(result.length).toEqual(2);
		expect(result[0].name).toEqual("anArray");
		expect(result[1].name).toEqual("slice");
	});

	it("should return an array with the name of the variable and the name of the function for more functions", function() {
		var source = "anArray.slice(1,2).map(addOne);\n";
		var result = LineParser.parse(source);

		expect(result.length).toEqual(3);
		expect(result[0].name).toEqual("anArray");
		expect(result[1].name).toEqual("slice");
		expect(result[2].name).toEqual("map");
	});

	it("should return an array with the name of the variable and the name of the function if the call was on several lines", function() {
		var source = "anArray\n.slice(1,2)\n.map(addOne);\n";
		var result = LineParser.parse(source);

		expect(result.length).toEqual(3);
		expect(result[0].name).toEqual("anArray");
		expect(result[1].name).toEqual("slice");
		expect(result[2].name).toEqual("map");
	});

	it("should return an array with the name of the variable and the name of the function if some function argument is a function", function() {
		var source = "anArray\n.slice(1,2)\n.map(function(n) {\nreturn n + 1;\n});\n";
		var result = LineParser.parse(source);

		expect(result.length).toEqual(3);
		expect(result[0].name).toEqual("anArray");
		expect(result[1].name).toEqual("slice");
		expect(result[2].name).toEqual("map");

		source = "anArray.map(function(n) {\nreturn n + 1;\n}).slice(1,2);\n";
		result = LineParser.parse(source);

		expect(result.length).toEqual(3);
		expect(result[0].name).toEqual("anArray");
		expect(result[1].name).toEqual("map");
		expect(result[2].name).toEqual("slice");
	});

	it("should return the number of parameters of the functions", function() {
		var source = "anArray\n.slice(1,2)\n.map(bla).splice(1,2,3);\n";
		var result = LineParser.parse(source);
		
		expect(result.length).toEqual(4);
		expect(result[0].name).toEqual("anArray");
		expect(result[1].paramsCount).toEqual(2);
		expect(result[2].paramsCount).toEqual(1);
		expect(result[3].paramsCount).toEqual(3);
	});
});

describe("For functions called on some literal", function() {
	it("should return an array with the initialized array and the name of the function for one function", function() {
		var source = "['a','b','c'].slice(1,2);\n";
		var result = LineParser.parse(source);

		expect(result.length).toEqual(2);
		expect(result[0].value).toEqual(['a','b','c']);
		expect(result[1].name).toEqual("slice");
	});

	it("should return an array with the initialized string and the name of the function for one function", function() {
		var source = "'foobar'.indexOf('b');\n";
		var result = LineParser.parse(source);

		expect(result.length).toEqual(2);
		expect(result[0].value).toEqual("foobar");
		expect(result[1].name).toEqual("indexOf");
	});	
});