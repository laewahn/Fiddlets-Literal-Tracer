/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global describe, it, require, expect */

"use strict";

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
					"};";

xdescribe("For the testSource", function(){
	it("should produce output when being parsed", function() {
		var tr = require("../lib/LiteralTracer");
		var tracer = new tr.Tracer();
		expect(tracer).toBeDefined();
		// console.log(tracer.trace(testSource));
	});
});

xdescribe("LiteralTracer", function() {
	it("should keep a list of where a variable was used", function() {
		var tr = require("../lib/LiteralTracer");
		var tracer = new tr.Tracer();
		
		var result = tracer.trace(testSource);
		expect(result.contextFor("index")[0].start.line).toEqual(5);
		expect(result.contextFor("howMany")[0].start.line).toEqual(6);

		expect(result.contextFor("anArray").length).toEqual(2);
		expect(result.contextFor("anArray")[0].start.line).toEqual(7);
		expect(result.contextFor("anArray")[1]).toBeDefined();
		expect(result.contextFor("anArray")[1].start.line).toEqual(8);
	});
});

describe("The domain controller", function() {

	var controller = require("../LiteralTracerDomainController");

	xit("should have a command to get the context for a line", function() {
		expect(controller.contextForLineCmd).toBeDefined();
	});

	xit("should return a context map for every variable used in the line", function() {
		controller.traceCmd(testSource, {line: 1, ch: 1});

		var line = "var newArry = anArray.slice(0,index).map(appendBla);\r\n";
		var result = controller.contextForLineCmd(line);
		expect(Object.keys(result)).toEqual(["anArray", "index", "appendBla"]);
	});

	xit("should return a context map for locally available functions used in the line", function() {
		controller.traceCmd(testSource, {line: 1, ch: 1});

		var line = "var x = appendBla(prependFoo(bla)).indexOf(\'blax\');\r\n";
		var result = controller.contextForLineCmd(line);
		expect(Object.keys(result)).toEqual(["bla", "prependFoo", "appendBla"]);
	});

	xit("should have a command to get the context for a line in some source", function() {
		var result = controller.contextForPositionInSourceCmd({line: 10, ch: 1}, testSource);
		expect(Object.keys(result)).toEqual(["anArray", "index" ,"appendBla"]);
	});

	xit("should only return operations on objects used that occur before the selected line", function() {
		var result = controller.contextForPositionInSourceCmd({line: 12, ch: 1}, testSource);
		expect(Object.keys(result)).toEqual(["bla", "prependFoo" ,"appendBla"]);
		expect(result.bla.length).toEqual(1);
		expect(result.prependFoo).toBeDefined();
		expect(result.prependFoo.length).toBe(1);
	});

	xit("should not include the current line", function() {
		var result = controller.contextForPositionInSourceCmd({line: 13, ch: 1}, testSource);
		
		expect(result.bla.length).toEqual(1);
		expect(result.bla[0].start.line).toEqual(3);
	});

	xit("should include the context of the lines referenced by the context", function() {
		testSource = "var moviesAndPricesCSV = \"name\\tprice\\nCasablanca\\t10\\nCitizen Cane\\t7\\nNosferatu\\t5\";\n" +
					 "var lines = moviesAndPricesCSV.split(\"\\n\");\n" +
					 "var withoutHeader = lines.slice(1);\n";

        var result = controller.contextForPositionInSourceCmd({line: 3, ch: 1}, testSource);
        expect(Object.keys(result)).toEqual(["lines", "moviesAndPricesCSV"]);
	});

	xit("should include the context of the lines referenced by the context in a more elaborated example", function() {
		testSource = "var moviesAndPricesCSV = \"name\\tprice\\nCasablanca\\t10\\nCitizen Cane\\t7\\nNosferatu\\t5\";\n" +
					 "var lines = moviesAndPricesCSV.split(\"\\n\");\n" +
					 "var withoutHeader = lines.slice(1);\n" +
					 "var bar = [];\n" + 
					 "var baz = [];\n" +
					 "bar.push(baz);\n" +
					 "baz.push(lines);\n" +
					 "baz.push(bar);\n" +
					 "lines = bar;\n";

        var result = controller.contextForPositionInSourceCmd({line: 6, ch: 1}, testSource);
        expect(Object.keys(result)).toEqual(["bar", "baz"]);

        result = controller.contextForPositionInSourceCmd({line: 7, ch: 1}, testSource);
        expect(Object.keys(result)).toEqual(["baz", "lines", "moviesAndPricesCSV"]);

        result = controller.contextForPositionInSourceCmd({line: 8, ch: 1}, testSource);
        expect(Object.keys(result)).toEqual(["baz", "lines", "moviesAndPricesCSV", "bar"]);
	});

	xit("should be able to handle multiline commands", function() {
		testSource = "var moviesAndPricesCSV = \"name\\tprice\"+\n" +
					 "\"Casablanca\\t10\" + \n" +
					 "\"Citizen Cane\\t7\" + \n" +
					 "\"Nosferatu\\t5\";\n" +
					 "var lines = moviesAndPricesCSV.split(\"\\n\");\n";

		var result = controller.contextForPositionInSourceCmd({line: 5, ch: 1}, testSource);
        expect(Object.keys(result)).toEqual(["moviesAndPricesCSV"]);
	});

	xit("should handle empty lines", function() {
		testSource = 	"var moviesAndPricesCSV = \"name\\tprice\\n\" +\r\n" + 
						"\"Casablanca\\t10\\n\" +\r\n" +
						"\"Citizen Cane\\t7\\n\" +\r\n" +
						"\"Nosferatu\\t5\";\r\n" +
						"\/\/ Parse the CSV into movie objects\r\n" +
						"\r\n" +
						"var movieFromLine = function(line) {\r\n" +
						"	var elements = line.split(\"\\t\");\r\n" +
						"   return new Movie(elements[0], elements[1]);\r\n" +
						"}\r\n" +
						"\r\n" +
						"var lines = moviesAndPricesCSV.split(\"\\n\");\r\n" +
						"var movies = lines.slice(1).map(movieFromLine);\r\n" +
						"movies.push(\"foo\");";

		var result = controller.contextForPositionInSourceCmd({line: 14, ch: 1}, testSource);
		expect(Object.keys(result).length).toEqual(4);
		expect(Object.keys(result)).toEqual(["movies", "lines", "moviesAndPricesCSV", "movieFromLine"]);
	});

	xit("should find references to classes", function() {
		testSource = "function SomeClass(name) {\r\n"+
					 "    this.name = name;\r\n"+
					 "}\r\n"+
					 "\r\n"+
					 "SomeClass.prototype.name = undefined;\r\n"+
					 "SomeClass.prototype.foo = function() {\r\n"+
					 "    console.log(\"foo\");\r\n"+
					 "}\r\n"+
					 "\r\n"+
					 "var asdf = new SomeClass();\r\n"+
					 "asdf.foo();\r\n";

		var result = controller.contextForPositionInSourceCmd({line: 10, ch: 1}, testSource);
		expect(Object.keys(result)).toEqual(["SomeClass"]);
	});

	it("should find references to the classes methods", function() {
		testSource = "function SomeClass(name) {\r\n"+
					 "//    this.name = name;\r\n"+
					 "}\r\n"+
					 "\r\n"+
					 "//SomeClass.prototype.name = undefined;\r\n"+
					 "SomeClass.prototype.foo = function() {\r\n"+
					 "    console.log(\"foo\");\r\n"+
					 "}\r\n"+
					 "\r\n"+
					 "var asdf = new SomeClass();\r\n"+
					 "asdf.foo();\r\n";

		var tr = require("../lib/LiteralTracer");
		var tracer = new tr.Tracer();
		
		var tracingResult = tracer.trace(testSource);
		var theFoo = tracingResult.tracedValueFor("SomeClass").prototype.foo;
		expect(theFoo).toBeDefined();
		
		// console.log("!!!! " + typeof(theFoo));
		// console.log("!!!! " + JSON.stringify(tracingResult.tracedValueFor("SomeClass").prototype.foo));
		expect(tracingResult.contextFor("SomeClass")).toBeDefined();

		var result = controller.contextForPositionInSourceCmd({line: 11, ch: 1}, testSource);
		expect(Object.keys(result)).toEqual(["asdf", "foo", "SomeClass"]);
	});
});