var esprima = require('esprima');
var _ = require('lodash');
var tr = require('./TracingResults.js');
var escodegen = require('escodegen');

function Tracer() {}
Tracer.prototype.constructor = Tracer;

Tracer.prototype.trace = function(source) {
  var parsed = esprima.parse(source, {loc : true});
  // console.log(JSON.stringify(parsed, null, 2));
  var tracingResults = {};
  traceBody(parsed.body, tracingResults);

  return new tr.TracingResults(tracingResults);  
}

function traceBody(body, tracingResults) {
  // console.log("traceBody called from " + arguments.callee.caller.toString());
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
        addNewNamedScopeFor(line, line.id.name, tracingResults);
        // console.log("traceBody: Creating function for " + line.id.name);
        tracingResults[line.id.name] = functionFor(line, tracingResults);
        break;
      case "EmptyStatement":
        break;
      default:
        // throw new Error("Unsupported type: " + line.type + " in\n" + JSON.stringify(line, null, 2));
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
      addNewNamedScopeFor(initialization, variableName, tracingResults);
      // console.log("initializeVariable: Creating function for " + variableName);
      tracingResults[variableName] = functionFor(initialization, tracingResults);
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

function functionFor(expression, tracingResults) {
  var functionProxy = function() {
    
    var params = [];
    expression.params.forEach(function(param) {
      params.push(param.name);
    });

    var functionCode = escodegen.generate(expression.body);
    var actualFunction = new Function(params, functionCode);
    return actualFunction.apply(actualFunction, arguments);
  };

  return functionProxy;
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
      addNewScopeFor(identifierOrLiteral, tracingResults);
      return functionFor(identifierOrLiteral, tracingResults);
    case "ThisExpression" :
      return tracingResults
    default:  
      throw new Error("Unsupported type: " + identifierOrLiteral.type + " in\n" + JSON.stringify(identifierOrLiteral, null, 2));
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
    addNewNamedScopeFor(something, null, tracingResults);
}

function addNewNamedScopeFor(something, name, tracingResults) {
  var newScope = {};
  newScope.__parentScope = tracingResults;
  traceBody(something.body.body, newScope);
  newScope.__location = something.body.loc;
  newScope.__scopeName = name;
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

exports.Tracer = Tracer;