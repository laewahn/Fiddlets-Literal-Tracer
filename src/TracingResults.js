function TracingResults(results) {
  this.results = results;
}

TracingResults.prototype.results = undefined;

var INTERNAL_KEYS = ["__location", "__scopes", "__scopeName"];

TracingResults.prototype.allAssignments = function() {
  var assignments = {};
  var theScope = this.results;

  while(theScope !== undefined) {
    
    Object.keys(theScope).forEach(function(key){
      if (assignments[key] === undefined && (INTERNAL_KEYS.indexOf(key) === -1)) {
        assignments[key] = theScope[key];
      }
    });

    theScope = theScope.__parentScope;
  }

  return assignments;  
}

TracingResults.prototype.tracedValueFor = function(variableName) {
  return this.allAssignments()[variableName];
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