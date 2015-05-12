/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global require, exports */

(function() {
	 "use strict";
	
	var LITERAL_TRACER_DOMAIN = "literalTracerDomain";
	var LITERAL_TRACER_VERSION = {major : 0, minor: 1};

	var LiteralTracerDomainController = require("./literalTracerDomainController");

    function init(domainManager) {
		if(!domainManager.hasDomain(LITERAL_TRACER_DOMAIN)) {
			domainManager.registerDomain(LITERAL_TRACER_DOMAIN, LITERAL_TRACER_VERSION);
		}

		domainManager.registerCommand(
			LITERAL_TRACER_DOMAIN,
			"trace",
			LiteralTracerDomainController.traceCmd,
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
			LiteralTracerDomainController.elementsForLineCmd,
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
			LiteralTracerDomainController.executeLineUntilCmd,
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
				type: "array",
				description: "An array containing the return values of the elements of the function execution"
			}]
		);

		domainManager.registerCommand(
			LITERAL_TRACER_DOMAIN,
			"contextForLine",
			LiteralTracerDomainController.contextForLineCmd,
			false,
			"Returns a map with the locations of parts of the code that are relevant for this line",
			[{
				name: "line",
				type: "string",
				description: "The current line of code"
			}],
			[{
				name: "context",
				type: "object",
				description: "A map which indexes positions in the source code by identifier name"
			}]
		);

		domainManager.registerCommand(
			LITERAL_TRACER_DOMAIN,
			"contextForPositionInSource",
			LiteralTracerDomainController.contextForPositionInSourceCmd,
			false,
			"Returns a map with the locations of parts of the code relevant for the line given in the position parameter",
			[{
				name: "position",
				type: "object",
				description: "The position for which the context should be returned"
			},
			{
				name: "source",
				type: "string",
				description: "The source code"	
			}],
			[{
				name: "context",
				type: "object",
				description: "The context for the position"
			}]);
	}

	exports.init = init;

}());