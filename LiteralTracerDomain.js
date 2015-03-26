 (function() {
	 "use strict";
	
	var LiteralTracer = require("./lib/LiteralTracer");

	var LITERAL_TRACER_DOMAIN = "literalTracerDomain";
	var LITERAL_TRACER_VERSION = {major : 0, minor: 1};

	var lastTrace;

	function traceCmd(source) {
		 var tracer = new LiteralTracer.Tracer();
		 lastTrace = tracer.trace(source);
	}

	function assignmentsOfScopeForPositionCmd(line, column) {
		return {foo : "bar_" + line + "_" + column};
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
			[]
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
			}]);
	}

	exports.init = init;
 }());