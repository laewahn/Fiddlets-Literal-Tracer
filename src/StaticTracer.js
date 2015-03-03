var esprima = require('esprima');

exports.trace = function(source) {
    var parsed = esprima.parse(source);
    // console.log(JSON.stringify(parsed, null, 2));
    
    var returnObject = {};
    var varValue;
    var declIdx;

    for(declIdx in parsed.body) {
      var declaration = parsed.body[declIdx].declarations[0];
      varName = declaration.id.name;
      
      if(declaration.init == null) {
          returnObject[varName] = null;
          return returnObject;
      }
      
      if(declaration.init.type === "ArrayExpression") {
          var elements = [];
          var idx;
          for(idx in declaration.init.elements) {
              elements.push(declaration.init.elements[idx].value);
          }
          varValue = elements;
      } else if(declaration.init.type === "ObjectExpression") {
         var object = {};
         var idx;
         var props = declaration.init.properties;
         for(idx in props) {
             object[props[idx].key.name] = props[idx].value.value; 
         }
         varValue = object;
      } else {
          varValue = declaration.init.value;
      }
  
      returnObject[varName] = varValue;
    }
    
    return returnObject; 
};
