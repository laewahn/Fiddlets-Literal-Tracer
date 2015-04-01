var esprima = require('esprima');
var _ = require('lodash');

exports.parse = function(source) {
	var parsed = esprima.parse(source, {loc: true});
	
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
			lineElements[lineElements.length - 1].paramsCount = expression.arguments.length;
			break;		
		case "MemberExpression" :
			parseExpression(expression.object, lineElements);
			lineElements.push({name: expression.property.name, loc: expression.property.loc});
			break;
		case "Identifier" :
			lineElements.push({name: expression.name, loc: expression.loc});
			break;
		case "ArrayExpression" :
			lineElements.push({value: elementsOf(expression), loc: expression.loc});
			break;	
		case "Literal" :
			lineElements.push({value: expression.value, loc : expression.loc});
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
