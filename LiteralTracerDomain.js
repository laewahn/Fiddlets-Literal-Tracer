(function() {
	"use strict";
	
	var LITERAL_TRACER_DOMAIN = "literalTracerDomain";
	var LITERAL_TRACER_VERSION = {major : 0, minor: 1};

	function init(domainManager) {
		if(!domainManager.hasDomain(LITERAL_TRACER_DOMAIN)) {
			domainManager.register(	LITERAL_TRACER_DOMAIN, 
									LITERAL_TRACER_VERSION );
		}

		// register commands here.
	}

	exports.init = init;
}());