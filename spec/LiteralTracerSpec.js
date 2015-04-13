/*global require, describe, it, expect, beforeEach */

"use strict";

describe("Brackets domain", function(){
	
	var domain;

	beforeEach(function() {
		expect(function() {
			domain = require("../LiteralTracerDomain.js");
		}).not.toThrow();
	});

	it("has an init method", function(){
		expect(domain.init).toBeDefined();
	});
});