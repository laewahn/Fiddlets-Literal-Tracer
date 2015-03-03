var esprima = require('esprima');

exports.trace = function(source) {
    var parsed = esprima.parse(source);
    //console.log(JSON.stringify(parsed, null, 2));
    
    var returnObject = {};
    var firstDeclaration = parsed.body[0].declarations[0];
    var varName = firstDeclaration.id.name;
    var varValue;
    if(firstDeclaration.init.type === "ArrayExpression") {
        var elements = [];
        var idx;
        for(idx in firstDeclaration.init.elements) {
            elements.push(firstDeclaration.init.elements[idx].value);
        }
        varValue = elements;
    } else if(firstDeclaration.init.type === "ObjectExpression") {
       var object = {};
       var idx;
       var props = firstDeclaration.init.properties;
       for(idx in props) {
           object[props[idx].key.name] = props[idx].value.value; 
       }
       varValue = object;
    } else {
        varValue = firstDeclaration.init.value;
    }

    returnObject[varName] = varValue;
    return returnObject; 
};
