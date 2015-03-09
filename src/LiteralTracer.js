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
          break;
        default:

      }
    });
    
    return tracingResults; 
};

function evaluateVariableDeclaration(declarations, tracingResults) {

  declarations.forEach(function(declaration) {
    
    var varName = declareVariable(declaration, tracingResults);
    
    if (declaration.init != null) {
      initializeVariable(varName, declaration.init, tracingResults);  
    };
  });
}

function declareVariable(declaration, tracingResults) {
  var varName = declaration.id.name;
  tracingResults[varName] = null;
  return varName
}

function initializeVariable(variableName, initialization, tracingResults) {
  switch(initialization.type) {
    case "ArrayExpression" :
      tracingResults[variableName] = elementsOf(initialization);    
      break;
    case "ObjectExpression" :
      tracingResults[variableName] = propertiesOf(initialization);
      break;
    case "AssignmentExpression" :
      var assignedTo = evaluateExpressionStatement(initialization, tracingResults);
      tracingResults[variableName] = tracingResults[assignedTo];
      break;
    case "Literal" :
      tracingResults[variableName] = initialization.value;
      break;
    case "Identifier" :
      tracingResults[variableName] =  tracingResults[initialization.name];
      break;
    case "BinaryExpression" :
      tracingResults[variableName] = evaluateBinaryExpression(initialization, tracingResults);
      break;
    default:
  }
} 

function evaluateBinaryExpression(expression, tracingResults) {
  var lValue = valueFor(expression.left, tracingResults);
  var rValue = valueFor(expression.right, tracingResults);

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

  }
}

function valueFor(identifierOrLiteral, tracingResults) {
  switch(identifierOrLiteral.type) {
    case "Literal" :
      return identifierOrLiteral.value;
    case "Identifier" :
      return tracingResults[identifierOrLiteral.name];
    case "BinaryExpression" :
      return evaluateBinaryExpression(identifierOrLiteral, tracingResults);
    case "AssignmentExpression" :
      return evaluateExpressionStatement(identifierOrLiteral, tracingResults);
    default:
  }
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
