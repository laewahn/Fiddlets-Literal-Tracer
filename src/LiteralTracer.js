var esprima = require('esprima');
var _ = require('lodash');

exports.trace = function(source) {
    var parsed = esprima.parse(source);
    // console.log(JSON.stringify(parsed, null, 2));

    var returnObject = {};
    
    parsed.body.forEach(function(line) {
      switch(line.type) {
        case "VariableDeclaration": 
          evaluateVariableDeclaration(line.declarations, returnObject);         
          break;
        case "ExpressionStatement":
          evaluateExpressionStatement(line.expression, returnObject);
      }
    });
    
    return returnObject; 
};

function evaluateVariableDeclaration(declarations, returnObject) {

  declarations.forEach(function(declaration) {
    
    var varValue;
    var varName = declaration.id.name;
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
      case "AssignmentExpression" :
        var assignedTo = evaluateExpressionStatement(declaration.init, returnObject);
        varValue = returnObject[assignedTo];
        break;
      case "BinaryExpression" :
        varValue = evaluateBinaryExpression(declaration.init, returnObject);
        break;
      default:
        varValue = valueFor(declaration.init, returnObject);
    }
    
    returnObject[varName] = varValue;
  });
}

function evaluateBinaryExpression(expression, returnObject) {
  var lValue = valueFor(expression.left, returnObject);
  var rValue = valueFor(expression.right, returnObject);
  
  switch(expression.operator) {
    case "+" :
      return lValue + rValue;
    case "-" :
      return lValue - rValue;
    case "/" :
      return lValue / rValue;
    case "%" :
      return lValue % rValue;
    default:
      return lValue * rValue;
  }
  
}

function valueFor(identifierOrLiteral, returnObject) {
  if (identifierOrLiteral.type === "Literal") {
    return identifierOrLiteral.value;
  } else if(identifierOrLiteral.type == "Identifier") {
    return returnObject[identifierOrLiteral.name];
  };

}

function evaluateExpressionStatement(expression, returnObject) {
  var assignTo = expression.left.name; 

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
