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
		// console.log(JSON.stringify(chain.calls, null, 2));
		var executionResult = [];
		chain.calls.slice(0, executionIdx + 1).forEach(function(e, idx) {
			// console.log("idx: " + idx + "\texecutionIdx: " + executionIdx);
			var tempResult = { 
				'returnValue' : (idx >= executionIdx) ? returnValue : chain.calls[idx + 1].unprocessedInput,
				'input' : e.unprocessedInput 
			}
			// console.log(JSON.stringify(e) + "\n=========\n" + JSON.stringify(tempResult) + "\n");
			executionResult.push(tempResult);
		});

		// return { 'returnValue' : returnValue,
				 // 'input' : chain.calls[idx].unprocessedInput };
		return executionResult;
	}
}())