function TracingResults() {}


TracingResults.prototype.tracedValueFor = function(variableName) {
  return this[variableName];
}

TracingResults.prototype.tracedValueOfScopeInLine = function(variableName, line) {
  var theLine = line;
  var theScope = this.scopeForLine(theLine);
  var returnValue = theScope[variableName];
  
  while(theScope !== undefined && (returnValue === null || returnValue === undefined)) {
    theScope = theScope.__parentScope;
    returnValue = theScope[variableName];
  }

  return returnValue;
}

TracingResults.prototype.scopeForLine = function(line) {
  return findScopeWith(function(scope) {
    return scope.__location.start.line < line && line < scope.__location.end.line
  }, this);
}

TracingResults.prototype.scopeByName = function(functionName) {
  return findScopeWith(function(scope) {
    return scope.__scopeName === functionName;
  }, this);
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

exports.TracingResults = TracingResults;