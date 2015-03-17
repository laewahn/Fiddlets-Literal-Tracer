function TracingResults(results) {
  this.results = results;
}

TracingResults.prototype.results = undefined;

TracingResults.prototype.tracedValueFor = function(variableName) {
  var theScope = this.results;
  var returnValue;
  // console.log(theScope.__parentScope);

  while(theScope !== undefined && returnValue === undefined) {
    returnValue = theScope[variableName];
    theScope = theScope.__parentScope;
  }

  return returnValue;
}

TracingResults.prototype.tracedValueOfScopeInLine = function(variableName, line) {
  var theScope = this.scopeForLine(line).results;
  var returnValue = theScope[variableName];
  
  while(theScope !== undefined && (returnValue === null || returnValue === undefined)) {
    theScope = theScope.__parentScope;
    returnValue = theScope[variableName];
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