/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global require, exports */

(function(){
	"use strict";

	FunctionCall.prototype.constructor = FunctionCall;
	FunctionCall.prototype.name = undefined;
	FunctionCall.prototype.args = undefined;
	FunctionCall.prototype.unprocessedInput = undefined;
	FunctionCall.prototype.original = undefined;	

	exports.functionChainFromLine = function(line, context) {
		var LineParser = require("./LineParser");
		var parsedLine = LineParser.parse(line);
		
		function valueOf(e) {
			if(e.type === "CallExpression")  {
				var params = e.params.map(valueOf);
				return context[e.name].apply(context[e.name], params);
			} else {
				return e.value || context[e.name];
			}
		}

		function nameOf(e) {
			return (e.type === "CallExpression") ? "[anonymous]" : e.name;
		}
		
		var firstElement = parsedLine[0];
		var calls = [new ObjectCall(nameOf(firstElement), valueOf(firstElement))];
	
		parsedLine.slice(1).forEach(function(fn) {
			var params = fn.params.map(valueOf);
			calls.push(new FunctionCall(fn.name, params));
		});
	
		return new FunctionChain(calls);
	};
	
	function FunctionCall(name, args) {
		this.name = name;
		this.args = args;
	}
	
	FunctionCall.prototype.executeOn = function(object) {
		// We need to access the String prototype different, since String does not work on Object.getPrototypeOf
		var prototype = (typeof(object) === "string") ? String.prototype : Object.getPrototypeOf(object);
		return prototype[this.name].apply(object, this.args);
	};
	
	
	FunctionChain.prototype.constructor = FunctionChain;
	FunctionChain.prototype.calls = [];
	
	function FunctionChain(calls) {
		this.calls = calls;
	}
	
	FunctionChain.prototype.executeUntil = function(steps) {
		var intermediateResult;

		for(var currentStep = 0; currentStep <= steps; currentStep++) {
			this.calls[currentStep].unprocessedInput = (intermediateResult !== undefined) ? intermediateResult.slice() : null;
			intermediateResult = this.calls[currentStep].executeOn(intermediateResult);
			this.calls[currentStep].original = this.calls[0].object.slice();
		}

		return intermediateResult;
	};
	
	
	ObjectCall.prototype.constructor = ObjectCall;
	ObjectCall.prototype.name = undefined;
	ObjectCall.prototype.object = undefined;
	ObjectCall.prototype.original = undefined;
	
	function ObjectCall(name, object) {
		this.original = object;
		this.object = object;
		this.name = name;
	}
	
	ObjectCall.prototype.executeOn = function() {
		return this.object;
	};
	
	exports.FunctionChain = FunctionChain;
	exports.FunctionCall = FunctionCall;
	exports.ObjectCall = ObjectCall;
	
}());