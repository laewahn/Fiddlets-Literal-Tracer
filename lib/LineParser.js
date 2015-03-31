var esprima = require('esprima');
var _ = require('lodash');

exports.parse = function(source) {
	var parsed = esprima.parse(source);
	
	var line = parsed.body[0];
	var lineElements = [];
	
	if(line.type === "ExpressionStatement") {
		parseExpression(line.expression, lineElements);
	}

	return lineElements;
}

function parseExpression(expression, lineElements) {
	switch(expression.type) {
		case "CallExpression" :
			parseExpression(expression.callee, lineElements);
			break;		
		case "MemberExpression" :
			parseExpression(expression.object, lineElements);
			lineElements.push(expression.property.name);
			break;
		case "Identifier" :
			lineElements.push(expression.name);
			break;
		case "ArrayExpression" :
			lineElements.push(elementsOf(expression));
			break;	
		case "Literal" :
			lineElements.push(expression.value);
			break;
		default:
			break;
	}
}

function elementsOf(initialization) {
  return _.reduce(initialization.elements, function(result, element) {
    result.push(element.value);
    return result;
  }, []);
}
