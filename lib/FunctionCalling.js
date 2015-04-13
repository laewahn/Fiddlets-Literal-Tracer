FunctionCall.prototype.constructor = FunctionCall;
FunctionCall.prototype.name = undefined;
FunctionCall.prototype.args = undefined;
FunctionCall.prototype.unprocessedInput = undefined;

exports.functionChainFromLine = function(line, context) {
	var LineParser = require('./LineParser');
	var parsedLine = LineParser.parse(line);
	
	function valueOf(e) {
		return e.value || context[e.name];
	}
	
	var firstElement = parsedLine[0];
	var calls = [new ObjectCall(firstElement.name, valueOf(firstElement))];

	parsedLine.slice(1).forEach(function(fn) {
		var params = fn.params.map(valueOf);
		calls.push(new FunctionCall(fn.name, params));
	});

	return new FunctionChain(calls);
}

function FunctionCall(name, args) {
	this.name = name;
	this.args = args;
}

FunctionCall.prototype.executeOn = function(object) {
	var functionImplementation = object.__proto__[this.name];
	return functionImplementation.apply(object, this.args);
}


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
	}
	return intermediateResult;
}


ObjectCall.prototype.constructor = ObjectCall;
ObjectCall.prototype.name = undefined;
ObjectCall.prototype.object = undefined;

function ObjectCall(name, object) {
	this.object = object;
	this.name = name;
}

ObjectCall.prototype.executeOn = function(unused) {
	return this.object;
}

exports.FunctionChain = FunctionChain;
exports.FunctionCall = FunctionCall;
exports.ObjectCall = ObjectCall;