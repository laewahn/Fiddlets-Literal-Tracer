 (function() {
	 "use strict";
	
	var LiteralTracer = require("./lib/LiteralTracer");
	var LineParser = require("./lib/LineParser");

	var LITERAL_TRACER_DOMAIN = "literalTracerDomain";
	var LITERAL_TRACER_VERSION = {major : 0, minor: 1};

	var lastTrace;

	function traceCmd(source) {
		 var tracer = new LiteralTracer.Tracer();
		 lastTrace = tracer.trace(source);
		 console.log("Last trace: " + lastTrace);
		 return {foo: "Foo"};
	}

	function assignmentsOfScopeForPositionCmd(line, column) {
		return lastTrace.scopeForPosition(line, column).allAssignments();
		// return {foo : "bar_" + line + "_" + column};
	}

	function elementsForLineCmd(line) {
		console.log("Last trace: " + lastTrace);
		var lineElements = LineParser.parse(line);

		lineElements.foreach(function(element){
			if(lineElements !== undefined && element.name !== undefined) {
				var assignment = lastTrace.allAssignments()[element.name];
				if (assignment !== undefined) {
					element.value = assignment;
				}
			}
		});

		return lineElements;
	}
     
    function init(domainManager) {
		if(!domainManager.hasDomain(LITERAL_TRACER_DOMAIN)) {
			domainManager.registerDomain(LITERAL_TRACER_DOMAIN, LITERAL_TRACER_VERSION);
		}

		domainManager.registerCommand(
			LITERAL_TRACER_DOMAIN,
			"trace",
			traceCmd,
			false,
			"Performs a tracer run on the given source code",
			[{	name: "source",
				type: "string",
				description: "The source to trace"
			}],
			[{
				name: "trace",
				type: "object",
				description: "Trace results"
			}]
		);

		domainManager.registerCommand(
			LITERAL_TRACER_DOMAIN,
			"assignmentsOfScopeForPosition",
			assignmentsOfScopeForPositionCmd,
			false,
			"Returns all assignments that are available for the scope in the given line and column",
			[{	name: "line",
				type: "number",
				description: "The line of the scope"
			},
			{	name: "column",
				type: "number",
				description: "the column of the scope"
			}],
			[{
				name: "assignments",
				type: "object",
				description: "An object with the values of the assignments indexed by the name of the assignments"
			}]
		);

		domainManager.registerCommand(
			LITERAL_TRACER_DOMAIN,
			"elementsForLine",
			elementsForLineCmd,
			false,
			"Returns the functions of chained function call",
			[{
				name: "line",
				type: "string",
				description: "A line of code containing a chained function call"
			}],
			[{
				name: "functions",
				type: "array",
				description: "An array containing the functions of the given chain and the object on which they are called"
			}]
			)
	}

	exports.init = init;
 }());