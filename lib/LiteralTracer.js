/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global require, exports */

(function(){
  "use strict";

  var esprima = require("esprima");
  var _ = require("lodash");
  var tr = require("./TracingResults.js");
  var escodegen = require("escodegen");
  
  function Tracer() {}
  Tracer.prototype.constructor = Tracer;
  
  Tracer.prototype.trace = function(source) {
    var parsed = esprima.parse(source, {loc : true, range: true});
    // console.log(JSON.stringify(parsed, null, 2));
    var tracingResults = { __location : parsed.loc };

    traceBody(parsed.body, tracingResults);
  
    return new tr.TracingResults(tracingResults, tracingResults.__contextMapping);  
  };
  
  function traceBody(body, tracingResults) {
    tracingResults.__scopes = [];
    tracingResults.__identifiers = [];
    tracingResults.__contextMapping = {};

    body.forEach(function(line) {
      evaluateLine(line, tracingResults, tracingResults.__contextMapping);
    });
      
    return tracingResults; 
  }
  
  function evaluateLine(line, tracingResults)
  {
    switch(line.type) {
        case "VariableDeclaration": 
          evaluateVariableDeclaration(line.declarations, tracingResults);         
          break;
        case "FunctionDeclaration":
          var scope = addNewNamedScopeFor(line, line.id.name, tracingResults);
          tracingResults[line.id.name] = functionFor(line, scope);
          break;
        case "ExpressionStatement":
          evaluateExpressionStatement(line.expression, tracingResults);
          break;
        case "ReturnStatement" :
          evaluateExpressionStatement(line.argument, tracingResults);
          break;
        default:
          // throw new Error("Unsupported type: " + line.type + " in\n" + JSON.stringify(line, null, 2));
          evaluateExpressionStatement(line, tracingResults);
      }
  }
  
  function evaluateVariableDeclaration(declarations, tracingResults) {
  
    declarations.forEach(function(declaration) {
      var varName = declareVariable(declaration, tracingResults);
      if (declaration.init !== null) {
        initializeVariable(varName, declaration.init, tracingResults);  
      }
    });
  }
  
  function declareVariable(declaration, tracingResults) {
    var varName = declaration.id.name;
    tracingResults[varName] = null;
    if (declaration.loc !== undefined) {
      tracingResults.__contextMapping[varName] = tracingResults.__contextMapping[varName] || [];
      
      tracingResults.__contextMapping[varName].push(declaration.loc);
      declaration.loc.range = declaration.range;
    }

    return varName;
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
        tracingResults.__identifiers.push(initialization.name);
        break;
      case "BinaryExpression" :
        tracingResults[variableName] = evaluateBinaryExpression(initialization, tracingResults);
        break;
      case "FunctionExpression" :
        var scope = addNewNamedScopeFor(initialization, variableName, tracingResults);
        tracingResults[variableName] = functionFor(initialization, scope);
        break;
      default:
        // throw new Error("Unsupported type: " + initialization.type + " in\n" + JSON.stringify(initialization, null, 2));
    }
  } 
  
  function evaluateExpressionStatement(expression, tracingResults) {
    switch(expression.type) {
      case "AssignmentExpression" :
        evaluateAssignmentExpression(expression, tracingResults);
        break;
      case "BinaryExpression" :
        evaluateBinaryExpression(expression, tracingResults);
        break;
      case "CallExpression" :
        if (expression.callee.object !== undefined) {
            if(tracingResults.__contextMapping[expression.callee.object.name] !== undefined) {
              expression.loc.range = expression.range;
              tracingResults.__contextMapping[expression.callee.object.name].push(expression.loc);
            }            
        }
        break;
      default:
      // throw new Error("Unsupported type: " + expression.type + " in\n" + JSON.stringify(expression, null, 2));
        break;
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
      console.log("Assigning to " + JSON.stringify(expression.left.property, null, 2));
      tracingResults.__contextMapping[expression.left.property.identifier] = expression.left.property.loc;
      expression.left.property.loc.range = expression.left.property.range;
    } else {
      tracingResults[assignTo] = valueFor(expression.right, tracingResults);
    }
    
    return assignTo;
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
  
  function functionFor(expression, scope) {
    
    var functionProxy = function() {
  
      var params = [];
      expression.params.forEach(function(param) {
        params.push(param.name);
      });
  
      var functionTrace = {};
      traceBody(expression.body.body, functionTrace, {});
      functionTrace.__identifiers.forEach(function(identifier) {
        if (functionTrace[identifier] === undefined && params.indexOf(identifier) === -1) {
          var parentDefinition = findIdentifierInParentScopesOf(scope, identifier);
  
          var missingPiece = 
            {
              "type": "VariableDeclaration",
              "declarations": [
                  {
                      "type": "VariableDeclarator",
                      "id": {
                          "type": "Identifier",
                          "name": identifier
                      },
                      "init": {
                          "type": "Literal",
                          "value": parentDefinition,
                      }
                  }
              ],
              "kind": "var"
            };
          expression.body.body.unshift(missingPiece);
          
        }
      });
      
      var functionCode = escodegen.generate(expression.body);

      /*jslint evil: true */
      var actualFunction = new Function(params, functionCode);
  
      return actualFunction.apply(actualFunction, arguments);
    };
  
    return functionProxy;
  }
  
  function findIdentifierInParentScopesOf(scope, identifier) {
    var theScope = scope;
    while(theScope !== undefined) {
      
      if (theScope[identifier] !== undefined) {
        return theScope[identifier];
      }
  
      theScope = theScope.__parentScope;
    }
  
    return null;
  }
  
  function valueFor(identifierOrLiteral, tracingResults) {
    switch(identifierOrLiteral.type) {
      case "Literal" :
        return identifierOrLiteral.value;
      case "Identifier" :
        tracingResults.__identifiers.push(identifierOrLiteral.name);
        return tracingResults[identifierOrLiteral.name] || identifierOrLiteral.name;
      case "BinaryExpression" :
        return evaluateBinaryExpression(identifierOrLiteral, tracingResults);
      case "MemberExpression" :
        return tracingResults[identifierOrLiteral.object.name][valueFor(identifierOrLiteral.property, tracingResults)];
      case "ObjectExpression" :
        return propertiesOf(identifierOrLiteral);
      case "FunctionExpression" :
        var scope = addNewScopeFor(identifierOrLiteral, tracingResults);
        return functionFor(identifierOrLiteral, scope);
      case "ThisExpression" :
        return tracingResults;
      default:  
        // throw new Error("Unsupported type: " + identifierOrLiteral.type + " in\n" + JSON.stringify(identifierOrLiteral, null, 2));
    }
  }
  
  function addNewScopeFor(something, tracingResults) {
      // console.log("Adding anonymous scope for " + JSON.stringify(something));
      return addNewNamedScopeFor(something, null, tracingResults);
  }
  
  function addNewNamedScopeFor(something, name, tracingResults) {
    var newScope = {};
    newScope.__parentScope = tracingResults;
    traceBody(something.body.body, newScope, {});
    newScope.__location = something.body.loc;
    newScope.__scopeName = name;
    tracingResults.__scopes.push(newScope);
    
    if (tracingResults.__contextMapping[name] === undefined) {
      tracingResults.__contextMapping[name] = [];
      tracingResults.__contextMapping[name].push(something.loc);
    }

    return newScope;
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
  
}());