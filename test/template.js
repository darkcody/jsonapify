var chai = require('chai');
var expect = chai.expect;

var util = require('util');
var mongoose = require('mongoose');

var TestModel = require('./testModel');
var Response = require('../lib/response');
var Template = require('../lib/accessors/template');

describe('Template', function() {
	describe('#serialize', function() {
		it('sets resource field according to template', function(done) {
			var object = new TestModel;
			var response = new Response;
			var template = new Template('/testmodels/{_id}');
			var expected = util.format('/testmodels/%s', object._id);
			template.serialize(object, response, function(err, value) {
				if (err) return done(err);
				expect(value).to.equal(expected);
				done();
			});
		});
	});
	
	describe('#deserialize', function() {
		it('does not change anything in document', function(done) {
			var output = {};
			var response = new Response;
			var id = mongoose.Types.ObjectId();
			var selfUrl = util.format('/testmodels/%s', id);
			var template = new Template('/testmodels/{_id}');
			template.deserialize(selfUrl, response, output, function(err) {
				if (err) return done(err);
				expect(output).to.be.empty;
				done();
			});
		});
	});
});
