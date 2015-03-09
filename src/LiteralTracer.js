var esprima = require('esprima');
var _ = require('lodash');

exports.trace = function(source) {
    var parsed = esprima.parse(source);
    // console.log(JSON.stringify(parsed, null, 2));
    
    var returnObject = {};
    var varValue;
    var lineIdx;
    var declIdx;
    var line;

    for(lineIdx in parsed.body) {
      line = parsed.body[lineIdx];
      for(declIdx in line.declarations) {
        var declaration = line.declarations[declIdx];
        varName = declaration.id.name;
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

          default:
            varValue = declaration.init.value || returnObject[declaration.init.name];
        }
        
        returnObject[varName] = varValue;
      }
    }
    
    return returnObject; 
};

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
