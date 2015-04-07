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
			
			var parseResult = lineElements[lineElements.length - 1];
			parseResult.paramsCount = expression.arguments.length;
			parseResult.loc.end = expression.loc.end;
			
			_.reduce(expression.arguments, function(result, element) {
				result.push(element.value || element.name);
				return result;
			}, parseResult.params);

			break;		
		case "MemberExpression" :
			parseExpression(expression.object, lineElements);

			lineElements.push({name: expression.property.name, 
				loc: expression.property.loc,
				params: []
			});
			break;
		case "Identifier" :
			lineElements.push({name: expression.name, loc: expression.loc, params: []});
			break;
		case "ArrayExpression" :
			lineElements.push({value: elementsOf(expression), loc: expression.loc, params: []});
			break;	
		case "Literal" :
			lineElements.push({value: expression.value, loc : expression.loc, params: []});
			break;
		default:
			break;
	}
}

function elementsOf(initialization) {
  return _.reduce(initialization.elements, function(result, element) {
    result.push(element.value || element.name);
    return result;
  }, []);
}
