/*global require, describe, it, expect */

"use strict";

var LineParser = require("../../lib/LineParser");

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

	it("should return the location of the function call", function() {
		var source = "anArray.slice(1,2).map(addOne);\n";
		var result = LineParser.parse(source);

		expect(result[1].loc.start.column).toBe(8);
		expect(result[1].loc.end.column).toBe(18);

		expect(result[2].loc.start.column).toBe(19);
		expect(result[2].loc.end.column).toBe(30);
	});

	it("should return the values of the params for each function call", function() {
		var source = "anArray.slice(1,2).map(addOne);\n";
		var result = LineParser.parse(source);
		
		expect(result[0].params).toEqual([]);
		expect(result[1].params[0].value).toEqual(1);
		expect(result[1].params[1].value).toEqual(2);
		expect(result[2].params[0].name).toEqual("addOne");
	});

	it("should return the identifiert for each parameter", function() {
		var source = "bar.push(baz);\n";
		var result = LineParser.parse(source);

		expect(result[1].params[0].name).toEqual("baz");
	});

	it("should return the position of the params for each function call", function() {
		var source = "anArray.slice(1,2).map(addOne);\n";
		var result = LineParser.parse(source);

		expect(result[1].params[0].loc.start.column).toEqual(14);
		expect(result[1].params[0].loc.end.column).toEqual(15);
		
		expect(result[1].params[1].loc.start.column).toEqual(16);
		expect(result[1].params[1].loc.end.column).toEqual(17);

		expect(result[2].params[0].loc.start.column).toEqual(23);
		expect(result[2].params[0].loc.end.column).toEqual(29);
	});

	it("should include information about whether something is an object or a function call", function() {
		var source = "anArray.slice(1,2).map(addOne);\n";
		var result = LineParser.parse(source);

		expect(result[0].type).toEqual("Identifier");
		expect(result[1].type).toEqual("CallExpression");

	});
});

describe("For functions called on some literal", function() {
	it("should return an array with the initialized array and the name of the function for one function", function() {
		var source = "['a','b','c'].slice(1,2);\n";
		var result = LineParser.parse(source);

		expect(result.length).toEqual(2);
		expect(result[0].value).toEqual(["a","b","c"]);
		expect(result[1].name).toEqual("slice");

		source = "[foo,'b','c'].slice(1,2);\n";
		result = LineParser.parse(source);

		expect(result.length).toEqual(2);
		expect(result[0].value).toEqual(["foo","b","c"]);
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

describe("For functions with functions as arguments", function() {
	it("should include these in the parameters", function() {
		var source = "addDashes(addAwesomeness('bla')).indexOf('a');\n";
		var result = LineParser.parse(source);

		expect(result.length).toEqual(2);
		expect(result[0].name).toEqual("addDashes");

		expect(result[0].params[0].name).toBeDefined();
		expect(result[0].params[0].name).toEqual("addAwesomeness");
	});
});

describe("For assignments with a function chain on the right hand side", function() {
	it("should ignore the assignment and just split the right hand function chain", function() {
		var source = "var anIndex = bla.indexOf('a');\n";
		var result = LineParser.parse(source);

		expect(result.length).toEqual(2);
		expect(result[0].name).toEqual('bla');
		expect(result[1].name).toEqual('indexOf');
	});
});

describe("For assignments with no function chain on the right hand side", function() {
	it("return the right hand side", function() {
		var source = "bar = foo\n";
		var result = LineParser.parse(source);

		expect(result.length).toEqual(1);
		expect(result[0].name).toEqual('foo');
	});
});

describe("For object instantiation", function() {
	it("return the class of the object", function(){
		var source = "var bar = new Foo(bar);\n";
		var result = LineParser.parse(source);

		expect(result.length).toEqual(1);
		expect(result[0].name).toEqual("Foo");
		expect(result[0].params[0].name).toEqual("bar");
	});
});