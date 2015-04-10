 (function() {
	 "use strict";
	
	var LiteralTracer = require("./lib/LiteralTracer");
	var LineParser = require("./lib/LineParser");

	var LITERAL_TRACER_DOMAIN = "literalTracerDomain";
	var LITERAL_TRACER_VERSION = {major : 0, minor: 1};

	var lastTrace;

	function traceCmd(source, position) {
		console.log(JSON.stringify("Position: " + position));
		var tracer = new LiteralTracer.Tracer();
		// lastTrace = tracer.trace(source).scopeForPosition(position.line, position.ch);
		lastTrace = tracer.trace(source);
		// console.log(JSON.stringify(lastTrace.allAssignments(), null, 2));

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
			)
	}

	exports.init = init;
 }());