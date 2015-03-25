function TracingResults(results) {
  this.results = results;
}

TracingResults.prototype.results = undefined;

var INTERNAL_KEYS = ["__location", "__scopes", "__scopeName", "__identifiers"];

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

TracingResults.prototype.scopeForPosition = function(line, column) {
  var scopeForPosition = findScopeWith(function(scope) {
    var start = scope.__location.start;
    var end = scope.__location.end;
    
    if (start.line === end.line) {
      return start.column < column && end.column > column;
    }

    if(start.line === line) {
      return start.column < column;
    }

    if(end.line === line) {
      return end.column > column;
    }

    return (start.line < line && line < end.line); 
  }, this.results);

  return new TracingResults(scopeForPosition || this.results);
}

TracingResults.prototype.scopeByName = function(functionName) {
  return new TracingResults(findScopeWith(function(scope) {
    return scope.__scopeName === functionName;
  }, this.results));
}

function findScopeWith(evaluationFunction, tracingResults) {
  var bestCandidate = null;
  var nextScope = tracingResults;
  
  if(evaluationFunction(tracingResults) === true) {
    bestCandidate = tracingResults;
  }

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