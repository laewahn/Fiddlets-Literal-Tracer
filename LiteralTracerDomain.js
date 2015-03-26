// (function() {
	// "use strict";
	
	var LiteralTracer = require("./lib/LiteralTracer");

	var LITERAL_TRACER_DOMAIN = "literalTracerDomain";
	var LITERAL_TRACER_VERSION = {major : 0, minor: 1};

	function traceCmd(source) {
		// var tracer = new LiteralTracer.Tracer();
		// return tracer.trace(source);
		return {foo : "bar"};
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
			"Returns the results for the literal tracer on the source",
			[{	name: "source",
				type: "string",
				description: "The source to trace"
			}],

			[{	name: "tracingResult",
				type: "object",
				description: "TracingResult for the source"
			}]
		);
	}

	exports.init = init;
// }());