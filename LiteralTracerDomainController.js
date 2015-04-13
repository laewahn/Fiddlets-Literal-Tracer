/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global require, exports */

(function(){
	"use strict";

	var lastTrace;

	var LiteralTracer = require("./lib/LiteralTracer");
	var LineParser = require("./lib/LineParser");
	var fc = require("./lib/FunctionCalling");

	exports.traceCmd = function(source, position) {
		var tracer = new LiteralTracer.Tracer();
		lastTrace = tracer.trace(source).scopeForPosition(position.line, position.ch);

		return lastTrace.allAssignments();
	};

	exports.elementsForLineCmd = function(line) {

		function isIdentifier(e) {
			return e.name !== undefined;
		}

		function hasParams(e) {
			return e.params !== undefined;
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

		var lineElements = LineParser.parse(line);
		
		lineElements.forEach(function(element){
			if(isIdentifier(element)) {
				substituteIdentifiersWithAssignments(element);

				if (hasParams(element)) {
					element.params.forEach(substituteIdentifiersWithAssignments);
				}
			}
		});

		return lineElements;
	};

	exports.executeLineUntilCmd = function(line, executionIdx) {
		var chain = fc.functionChainFromLine(line, lastTrace.allAssignments());
		var returnValue = chain.executeUntil(executionIdx);
		
		var executionResult = [];
		chain.calls.slice(0, executionIdx + 1).forEach(function(e, idx) {
			executionResult.push({ 
				returnValue : (idx >= executionIdx) ? returnValue : chain.calls[idx + 1].unprocessedInput,
				input : e.unprocessedInput 
			});
		});

		return executionResult;
	};

}());