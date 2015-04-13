(function(){
	"use strict"

	var lastTrace;

	var LiteralTracer = require("./lib/LiteralTracer");
	var LineParser = require("./lib/LineParser");
	var fc = require("./lib/FunctionCalling");

	exports.traceCmd = function(source, position) {
		var tracer = new LiteralTracer.Tracer();
		lastTrace = tracer.trace(source).scopeForPosition(position.line, position.ch);

		return lastTrace.allAssignments();
	}

	exports.elementsForLineCmd = function(line) {
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

	exports.substituteIdentifiersWithAssignments  = function(element) {
		var assignment = lastTrace.allAssignments()[element.name];
		if (typeof(assignment) === "function") {
			assignment = "[Function] " + element.name;
		}

		if (assignment !== undefined) {
			element.value = assignment;
		}
	}

	exports.executeLineUntilCmd = function(line, executionIdx) {
		var chain = fc.functionChainFromLine(line, lastTrace.allAssignments());
		var returnValue = chain.executeUntil(executionIdx);
		
		var executionResult = [];
		chain.calls.slice(0, executionIdx + 1).forEach(function(e, idx) {
			executionResult.push({ 
				'returnValue' : (idx >= executionIdx) ? returnValue : chain.calls[idx + 1].unprocessedInput,
				'input' : e.unprocessedInput 
			});
		});

		return executionResult;
	}
}())