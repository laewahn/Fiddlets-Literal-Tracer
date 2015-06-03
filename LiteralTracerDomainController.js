/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global require, exports */

(function(){
	"use strict";

	var lastTrace;

	var _ = require("lodash");
	var LiteralTracer = require("./lib/LiteralTracer");
	var LineParser = require("./lib/LineParser");
	var fc = require("./lib/FunctionCalling");

	exports.traceCmd = function(source, position) {
		var tracer = new LiteralTracer.Tracer();
		lastTrace = tracer.trace(source);

		return lastTrace.scopeForPosition(position.line, position.ch).allAssignments();
	};

	function hasParams(e) {
		return e.params !== undefined && e.params.length !== 0;
	}

	exports.elementsForLineCmd = function(line) {

		function isIdentifier(e) {
			return e.name !== undefined;
		}

		function substituteIdentifiersWithAssignments(element) {
			var assignment = lastTrace.tracedValueFor(element.name);
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
		var chain = fc.functionChainFromLine(line, lastTrace.scopeForPosition(line, 0).allAssignments());
		var returnValue = chain.executeUntil(executionIdx);
		
		var executionResult = [];
		chain.calls.slice(0, executionIdx + 1).forEach(function(e, idx) {
			executionResult.push({ 
				returnValue : (idx >= executionIdx) ? returnValue : chain.calls[idx + 1].unprocessedInput,
				input : e.unprocessedInput,
				original: { value : chain.calls[idx].original,
							name: chain.calls[0].name || "[anonymous]"
						}
			});
		});

		return executionResult;
	};

	exports.contextForLineCmd = function(line) {
		var parsedLine = LineParser.parse(line);

		function collectIdentifiers(c, e) {
			if(e.type === "Identifier") {
				c[e.name] = lastTrace.contextFor(e.name);
			}

			if (e.type === "CallExpression" || hasParams(e)) {
					e.params.forEach(function(p){
					collectIdentifiers(c, p);
				});

				if(lastTrace.contextFor(e.name) !== undefined) {
					c[e.name] = lastTrace.contextFor(e.name);
				}
			}

			return c;
		}

		return _.reduce(parsedLine, collectIdentifiers, {});
	};

	exports.contextForPositionInSourceCmd = function(position, source) {
		var lines = source.split("\n");
		var theLine = lines[position.line - 1];

		var trace = exports.traceCmd(source, position);
		var context = exports.contextForLineCmd(theLine);

		Object.keys(context).forEach(function(k) {
			_.remove(context[k], function(e) {
				return typeof(trace[k]) !== "function" && e.start.line > position.line - 1;
			});
		});

		var nestedContexts = {};
		collectContextForLine(theLine, lines, lastTrace, nestedContexts);

		return nestedContexts;
	};

	function collectContextForLine(line, allLines, trace, collector) {
		var contextFromLine = exports.contextForLineCmd(line);
		Object.keys(contextFromLine).forEach(function(idFromLine) {
			var contextFromTrace = trace.contextFor(idFromLine);
			if(contextFromTrace !== undefined && collector[idFromLine] === undefined) {
				
				collector[idFromLine] = contextFromLine[idFromLine];
				if( typeof(trace.results[idFromLine]) !== "function") {
					
					contextFromTrace.forEach(function(nextPosition){
						var nextLine = nextPosition.start.line - 1;
						collectContextForLine(allLines[nextLine], allLines, trace, collector);
					});
				}
			}
		});
	}

}());