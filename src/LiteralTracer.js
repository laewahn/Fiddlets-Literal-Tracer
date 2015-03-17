var esprima = require('esprima');
var _ = require('lodash');

exports.trace = function(source) {
  var parsed = esprima.parse(source, {loc : true});
  // console.log(JSON.stringify(parsed, null, 2));
  
  var tracingResults = {};
  return traceBody(parsed.body, tracingResults);  
}

function traceBody(body, tracingResults) {
  tracingResults.__scopes = [];

  body.forEach(function(line) {
    switch(line.type) {
      case "VariableDeclaration": 
        evaluateVariableDeclaration(line.declarations, tracingResults);         
        break;
      case "ExpressionStatement":
        evaluateExpressionStatement(line.expression, tracingResults);
        break;
      case "FunctionDeclaration":
        tracingResults[line.id.name] = new Function();
        
        var newScope = {};
        traceBody(line.body.body, newScope);
        newScope.__scopeName = line.id.name;
        newScope.__location = line.body.loc;
        tracingResults.__scopes.push(newScope);
        break;
      case "EmptyStatement":
        break;
      default:
        // throw new Error("Unsupported type: " + line.type + " in\n" + JSON.stringify(line, null, 2));
    }
  });
    
  return tracingResults; 
};

exports.scopeForLine = function(line, tracingResults) {
  return findScopeWith(function(scope) {
    return scope.__location.start.line < line && line < scope.__location.end.line
  }, tracingResults);
}

exports.scopeByName = function(functionName, tracingResults) {
  return findScopeWith(function(scope) {
    return scope.__scopeName === functionName;
  }, tracingResults);
}

function findScopeWith(evaluationFunction, tracingResults) {
  var bestCandidate = null;
  tracingResults.__scopes.forEach(function(scopeName) {

    var nextScope = scopeName;

    if (evaluationFunction(nextScope) === true) {
      bestCandidate = nextScope;
    }
    
    bestCandidate = findScopeWith(evaluationFunction, nextScope) || bestCandidate;
  });

  return bestCandidate;  
}

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
      tracingResults[variableName] = propertiesOf(initialization, tracingResults);
      break;
    case "AssignmentExpression" :
      var assignedTo = evaluateAssignmentExpression(initialization, tracingResults);
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
    case "FunctionExpression" :
      tracingResults[variableName] = new Function();
      
      // var newScope = {};
      // traceBody(initialization.body.body, newScope);
      // newScope.__scopeName = variableName;
      // newScope.__location = initialization.body.loc;
      // tracingResults.__scopes.push(newScope);
      break;
    default:
      // throw new Error("Unsupported type: " + initialization.type + " in\n" + JSON.stringify(initialization, null, 2));
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
      // throw new Error("Unsupported operator: " + expression.operator + " in\n" + JSON.stringify(expression, null, 2));
  }
}

function valueFor(identifierOrLiteral, tracingResults) {
  switch(identifierOrLiteral.type) {
    case "Literal" :
      return identifierOrLiteral.value;
    case "Identifier" :
      return tracingResults[identifierOrLiteral.name] || identifierOrLiteral.name;
    case "BinaryExpression" :
      return evaluateBinaryExpression(identifierOrLiteral, tracingResults);
    case "MemberExpression" :
      return tracingResults[identifierOrLiteral.object.name][valueFor(identifierOrLiteral.property, tracingResults)];
    case "ObjectExpression" :
      return propertiesOf(identifierOrLiteral);
    case "FunctionExpression" :
      // var newScope = {};
      // traceBody(identifierOrLiteral.body.body, newScope);
      // newScope.__location = identifierOrLiteral.body.loc;
      // tracingResults.__scopes.push(newScope);
      addNewScopeFor(identifierOrLiteral, tracingResults);
      return new Function();
    default:  
      // throw new Error("Unsupported type: " + identifierOrLiteral.type + " in\n" + JSON.stringify(identifierOrLiteral, null, 2));
  }
}

function evaluateExpressionStatement(expression, tracingResults) {
  if(expression.type === "AssignmentExpression") {
    evaluateAssignmentExpression(expression, tracingResults);
  } else {
    // throw new Error("Unsupported type: " + expression.type + " in\n" + JSON.stringify(expression, null, 2));
  }
}

function evaluateAssignmentExpression(expression, tracingResults) {
  var assignTo;
  assignTo = expression.left.name; 

  if(expression.right.type === "AssignmentExpression") {
    var previouslyAssigned = evaluateAssignmentExpression(expression.right, tracingResults);
    tracingResults[assignTo] = tracingResults[previouslyAssigned];
    assignTo = previouslyAssigned;     
  } else  if (expression.left.type === "MemberExpression") {
    assignTo = valueFor(expression.left.object, tracingResults);
    assignTo[valueFor(expression.left.property, tracingResults)] = valueFor(expression.right, tracingResults);
  } else {
    tracingResults[assignTo] = valueFor(expression.right, tracingResults);
  }
  
  return assignTo;
}

function addNewScopeFor(something, tracingResults) {
  var newScope = {};
      traceBody(something.body.body, newScope);
      newScope.__location = something.body.loc;
      newScope.__scopeName = something.id.name || null;
      tracingResults.__scopes.push(newScope);
}

function elementsOf(initialization) {
  return _.reduce(initialization.elements, function(result, element) {
    result.push(element.value);
    return result;
  }, []);
}

function propertiesOf(initialization, tracingResults) {
  return _.reduce(initialization.properties, function(result, property) {
    result[property.key.name] = valueFor(property.value, tracingResults);
    
    return result;
  }, {});
}
