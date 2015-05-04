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
					"var x = appendBla(prependFoo(bla)).indexOf(\'blax\');\r\nbla.indexOf(\'a\');\r\n" + 
					"function appendBla(entry) {\r\n" + 
					"\/\/\ty;\r\n" +
					"\treturn entry + \"_bla\"\r\n" + 
					"}\r\n" + 
					"\r\n" + 
					"function prependFoo(value) {\r\n" + 
					"\treturn \"foo_\" + value\r\n" + 
					"};";

xdescribe("testSource", function(){
	it("should produce output when being parsed", function() {
		var tr = require("../lib/LiteralTracer");
		var tracer = new tr.Tracer();
		expect(tracer).toBeDefined();
		console.log(tracer.trace(testSource));
	});
});

describe("LiteralTracer", function() {
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