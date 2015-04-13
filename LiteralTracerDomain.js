 (function() {
	 "use strict";
	
	var LiteralTracer = require("./lib/LiteralTracer");
	var LineParser = require("./lib/LineParser");
	var fc = require("./lib/FunctionCalling");

	var LITERAL_TRACER_DOMAIN = "literalTracerDomain";
	var LITERAL_TRACER_VERSION = {major : 0, minor: 1};

	var lastTrace;

	function traceCmd(source, position) {
		var tracer = new LiteralTracer.Tracer();
		lastTrace = tracer.trace(source).scopeForPosition(position.line, position.ch);

		return lastTrace.allAssignments();
	}

	function elementsForLineCmd(line) {
		var lineElements = LineParser.parse(line);

		lineElements.forEach(function(element){
			if(lineElements !== undefined && element.name !== undefined) {
				substituteIdentifiersWithAssignments(element);

				if (element.params !== undefined) {
					element.params.forEach(function(param) {
						substituteIdentifiersWithAssignments(param);
					});
				}
			}
		});

		return lineElements;
	}

	function substituteIdentifiersWithAssignments(element) {
		var assignment = lastTrace.allAssignments()[element.name];
		if (typeof(assignment) === "function") {
			assignment = "[Function] " + element.name;
		}

		if (assignment !== undefined) {
			element.value = assignment;
		}
	}

	function executeLineUntilCmd(line, idx) {
		var chain = fc.functionChainFromLine(line, lastTrace.allAssignments());
		var returnValue = chain.executeUntil(idx);
		return { 'returnValue' : returnValue };
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
			},
			{
				name: "position",
				type: "object",
				description: "position used to determine the scope for which the values are traced"
			}],
			[{
				name: "trace",
				type: "object",
				description: "Trace results"
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
			);

		domainManager.registerCommand(
			LITERAL_TRACER_DOMAIN,
			"executeLineUntil",
			executeLineUntilCmd,
			false,
			"Executes the given line of code within the context of the previous tracing results",
			[{
				name: "line",
				type: "string",
				description: "The line of code that should be executed."
			},
			{
				name: "idx",
				type: "number",
				description: "The index until which a chained function call should be executed."
			}],
			[{
				name: "result",
				type: "object",
				description: "An object containing the return value of the function execution"
			}]
		);
	}

	exports.init = init;
 }());