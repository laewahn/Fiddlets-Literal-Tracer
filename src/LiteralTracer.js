var esprima = require('esprima');
var _ = require('lodash');

exports.trace = function(source) {
    var parsed = esprima.parse(source);
    // console.log(JSON.stringify(parsed, null, 2));

    var tracingResults = {};
    
    parsed.body.forEach(function(line) {
      switch(line.type) {
        case "VariableDeclaration": 
          evaluateVariableDeclaration(line.declarations, tracingResults);         
          break;
        case "ExpressionStatement":
          evaluateExpressionStatement(line.expression, tracingResults);
      }
    });
    
    return tracingResults; 
};

function evaluateVariableDeclaration(declarations, tracingResults) {

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
        var assignedTo = evaluateExpressionStatement(declaration.init, tracingResults);
        varValue = tracingResults[assignedTo];
        break;
      case "BinaryExpression" :
        varValue = evaluateBinaryExpression(declaration.init, tracingResults);
        break;
      default:
        varValue = valueFor(declaration.init, tracingResults);
    }
    
    tracingResults[varName] = varValue;
  });
}

function evaluateBinaryExpression(expression, tracingResults) {
  var lValue = valueFor(expression.left, tracingResults);
  var rValue = valueFor(expression.right, tracingResults);
  
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

function valueFor(identifierOrLiteral, tracingResults) {
  if (identifierOrLiteral.type === "Literal") {
    return identifierOrLiteral.value;
  } else if(identifierOrLiteral.type == "Identifier") {
    return tracingResults[identifierOrLiteral.name];
  };

}

function evaluateExpressionStatement(expression, tracingResults) {
  var assignTo = expression.left.name; 

  switch(expression.right.type) {
    case "Identifier" :
      tracingResults[assignTo] = tracingResults[expression.right.name];
      break;
    case "Literal" :
      tracingResults[assignTo] = expression.right.value;
      break;
    default :
      var previouslyAssigned = evaluateExpressionStatement(expression.right, tracingResults);
      tracingResults[assignTo] = tracingResults[previouslyAssigned];
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
