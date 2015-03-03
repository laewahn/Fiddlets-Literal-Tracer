var esprima = require('esprima');

exports.trace = function(source) {
    var parsed = esprima.parse(source);
    //console.log(JSON.stringify(parsed, null, 2));

    return {
        variable : parsed["body"][0]["declarations"][0].id.name,
        literal: parsed["body"][0]["declarations"][0].init.value 
    };
};
