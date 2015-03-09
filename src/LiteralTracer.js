var esprima = require('esprima');

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
  var elements = [];
  var idx;

  for(idx in initialization.elements) {
    elements.push(initialization.elements[idx].value);
  }

  return elements;
}

function propertiesOf(initialization) {
  var object = {};
  var idx;
  var props = initialization.properties;
  
  for(idx in props) {
    object[props[idx].key.name] = props[idx].value.value; 
  }

  return object;
}
