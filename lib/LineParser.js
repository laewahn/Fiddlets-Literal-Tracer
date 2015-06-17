/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global require, exports */

(function(){
	"use strict";

	var esprima = require("esprima");
	var _ = require("lodash");
	
	exports.parse = function(source) {
		var parsed = esprima.parse(source, {loc: true, range: true});

		var line = parsed.body[0];
		var lineElements = [];

		if(line.type === "ExpressionStatement") {
			parseExpression(line.expression, lineElements);
		} else if (line.type === "VariableDeclaration") {
			parseExpression(line.declarations[0].init, lineElements);
		}

		return lineElements;
	};
	
	function parseExpression(expression, lineElements) {
		switch(expression.type) {
			case "CallExpression" :
				parseExpression(expression.callee, lineElements);
				
				var parseResult = lineElements[lineElements.length - 1] || [];
				parseResult.paramsCount = expression.arguments.length;
				parseResult.loc.end = expression.loc.end;
				parseResult.type = expression.type;
				
				_.reduce(expression.arguments, function(result, element) {
					parseExpression(element, result);
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
			case "AssignmentExpression":
				parseExpression(expression.right, lineElements);
				break;
			case "Identifier" :
				lineElements.push({name: expression.name, loc: expression.loc, params: [], type: expression.type});
				break;
			case "ArrayExpression" :
				lineElements.push({value: elementsOf(expression), loc: expression.loc, params: [], type: expression.type});
				break;	
			case "Literal" :
				lineElements.push({value: expression.value, loc : expression.loc, params: [], type: expression.type});
				break;
			case "BinaryExpression" :
				lineElements.push({value: evaluateBinaryExpression(expression), loc: expression.loc, type: expression.type});
				break;
			default:
				break;
		}
	}

	function evaluateBinaryExpression(expression) {
	  var lValue = expression.left.value;
	  var rValue = expression.right.value;
	
	  switch(expression.operator) {
	    case "+" :
	      return lValue + rValue;
	    case "-" :
	      return lValue - rValue;
	    case "*" :
	      return lValue * rValue;
	    case "/" :
	      return lValue / rValue;
	    case "%" :
	      return lValue % rValue;
	    default:
	      // throw new Error("Unsupported operator: " + expression.operator + " in\n" + JSON.stringify(expression, null, 2));
	  }
	}
	
	function elementsOf(initialization) {
	  return _.reduce(initialization.elements, function(result, element) {
	    result.push(element.value || element.name);
	    return result;
	  }, []);
	}

}());