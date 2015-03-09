var esprima = require('esprima');
var _ = require('lodash');

exports.trace = function(source) {
    var parsed = esprima.parse(source);
    
    var returnObject = {};
    var varValue;
    var lineIdx;
    var declIdx;
    var line;

    for(lineIdx in parsed.body) {
      line = parsed.body[lineIdx];
      if(line.type === "VariableDeclaration") {
          evaluateVariableDeclaration(line.declarations, returnObject);         

      } else if(line.type === "ExpressionStatement") {
          evaluateExpressionStatement(line.expression, returnObject);
        }
    }
    
    return returnObject; 
};

function evaluateVariableDeclaration(declarations, returnObject) {
  
  for(declIdx in declarations) {
    var declaration = declarations[declIdx];
    varName = declaration.id.name;
    declaration.init = declaration.init || {type: "Uninitialized"}; 
    switch(declaration.init.type) {
      case "Uninitialized" :
        varValue = null;
        break;
      case "ArrayExpression" :
        varValue = elementsOf(declaration.init);    
        break;
      case "ObjectExpression" :
        varValue = propertiesOf(declaration.init);
        break;
      default:
        varValue = declaration.init.value || returnObject[declaration.init.name];
    }
    
    returnObject[varName] = varValue;
  }
}

function evaluateExpressionStatement(expression, returnObject) {

  var assignTo = expression.left.name; 
  var val;

  switch(expression.right.type) {
    case "Identifier" :
      returnObject[assignTo] = returnObject[expression.right.name];
      break;
    case "Literal" :
      returnObject[assignTo] = expression.right.value;
      break;
    default :
      var previouslyAssigned = evaluateExpressionStatement(expression.right, returnObject);
      returnObject[assignTo] = returnObject[previouslyAssigned];
      assignTo = previouslyAssigned;     
  }

  return assignTo;
}

function elementsOf(initialization) {
  return _.reduce(initialization.elements, function(result, element) {
    result.push(element.value);
    return result;
  }, []);
}

function propertiesOf(initialization) {
  return _.reduce(initialization.properties, function(result, property) {
    result[property.key.name] = property.value.value;  
    return result;
  }, {});
}
