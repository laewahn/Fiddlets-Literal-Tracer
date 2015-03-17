function TracingResults(results) {
  this.results = results;
}

TracingResults.prototype.results = undefined;

TracingResults.prototype.tracedValueFor = function(variableName) {
  var theScope = this.results;
  var returnValue;

  while(theScope !== undefined && returnValue === undefined) {
    returnValue = theScope[variableName];
    theScope = theScope.__parentScope;
  }

  return returnValue;
}

TracingResults.prototype.scopeForLine = function(line) {
  return new TracingResults(findScopeWith(function(scope) {
    return scope.__location.start.line < line && line < scope.__location.end.line
  }, this.results));
}

TracingResults.prototype.scopeByName = function(functionName) {
  return new TracingResults(findScopeWith(function(scope) {
    return scope.__scopeName === functionName;
  }, this.results));
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