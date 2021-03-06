var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));
var mongoose = require('mongoose');
var httpMocks = require('node-mocks-http');
var ObjectId = mongoose.Types.ObjectId;
var expect = chai.expect;

var common = require('../common');
var jsonapify = require('../../');

var Runtime = jsonapify.Runtime;
var Resource = jsonapify.Resource;
var modify = jsonapify.middleware.modify;

describe('modify', function() {
	var model, resource, accessors, res;
	before(function(done) {
		mongoose.connect('mongodb://localhost/test', function(err) {
			if (err) return done(err);
			model = mongoose.model('ModifyTest', new mongoose.Schema);
			done();
		});
	});
	
	beforeEach(function() {
		accessors = {
			foo: new jsonapify.Accessor,
			field: common.createAccessor(),
			output: common.createAccessor(),
		};
		resource = new Resource(model, {
			type: 'test',
			field: {
				value: accessors.field,
				nullable: true,
			},
			output: {
				value: accessors.output,
				nullable: true,
			},
		});
		Runtime.addResource('ModifyResource', resource);
		res = httpMocks.createResponse();
	});
	
	afterEach(function(done) {
		Runtime.removeResource('ModifyResource');
		mongoose.connection.db.dropDatabase(done);
	});
	
	after(function(done) {
		mongoose.disconnect(done);
	});
	
	describe('add', function() {
		it('inserts element in array at index', function(done) {
			model.create({}, function(err, object) {
				if (err) return done(err);
				common.initAccessor(accessors.field, ['a', 'c']);
				common.initAccessor(accessors.output, undefined, object);
				var req = httpMocks.createRequest({
					params: { id: object._id.toString() },
					body: {
						data: [{
							op: 'add',
							path: '/field/1',
							value: 'b',
						}],
					},
				});
				var chain = ['ModifyResource', jsonapify.param('id')];
				modify(chain)(req, res, function(err) {
					if (err) return done(err);
					var resdata = JSON.parse(res._getData());
					expect(resdata).to.have.deep.property('data.field');
					expect(resdata.data.field).to.deep.equal(['a','b','c']);
					done();
				});
			});
		});
		
		it('adds new property to object', function(done) {
			model.create({}, function(err, object) {
				if (err) return done(err);
				common.initAccessor(accessors.field);
				common.initAccessor(accessors.output);
				var req = httpMocks.createRequest({
					params: { id: object._id.toString() },
					body: {
						data: [{
							op: 'add',
							path: '/field',
							value: 'value',
						}],
					},
				});
				var chain = ['ModifyResource', jsonapify.param('id')];
				modify(chain)(req, res, function(err) {
					if (err) return done(err);
					var resdata = JSON.parse(res._getData());
					expect(resdata).to.have.deep.property('data.field');
					expect(resdata.data.field).to.equal('value');
					done();
				});
			});
		});
		
		it('replaces existing object property', function(done) {
			model.create({}, function(err, object) {
				if (err) return done(err);
				common.initAccessor(accessors.field, 'prev');
				common.initAccessor(accessors.output);
				var req = httpMocks.createRequest({
					params: { id: object._id.toString() },
					body: {
						data: [{
							op: 'add',
							path: '/field',
							value: 'current',
						}],
					},
				});
				var chain = ['ModifyResource', jsonapify.param('id')];
				modify(chain)(req, res, function(err) {
					if (err) return done(err);
					var resdata = JSON.parse(res._getData());
					expect(resdata).to.have.deep.property('data.field');
					expect(resdata.data.field).to.equal('current');
					done();
				});
			});
		});
	});
	
	describe('remove', function() {
		it('removes the value at the target location', function(done) {
			model.create({}, function(err, object) {
				if (err) return done(err);
				common.initAccessor(accessors.field, 'value');
				common.initAccessor(accessors.output);
				var req = httpMocks.createRequest({
					params: { id: object._id.toString() },
					body: {
						data: [{
							op: 'remove',
							path: '/field',
						}],
					},
				});
				var chain = ['ModifyResource', jsonapify.param('id')];
				modify(chain)(req, res, function(err) {
					if (err) return done(err);
					var resdata = JSON.parse(res._getData());
					expect(resdata).to.not.have.deep.property('data.field');
					done();
				});
			});
		});
		
		it('gives an error if the value does not exist', function(done) {
			model.create({}, function(err, object) {
				if (err) return done(err);
				common.initAccessor(accessors.field);
				common.initAccessor(accessors.output);
				var req = httpMocks.createRequest({
					params: { id: object._id.toString() },
					body: {
						data: [{
							op: 'remove',
							path: '/invalid',
						}],
					},
				});
				var chain = ['ModifyResource', jsonapify.param('id')];
				modify(chain)(req, res, function(err) {
					expect(err).to.exist;
					done();
				});
			});
		});
	});
	
	describe('replace', function() {
		it('replaces the value at the target location', function(done) {
			model.create({}, function(err, object) {
				if (err) return done(err);
				common.initAccessor(accessors.field, 'prev');
				common.initAccessor(accessors.output);
				var req = httpMocks.createRequest({
					params: { id: object._id.toString() },
					body: {
						data: [{
							op: 'replace',
							path: '/field',
							value: 'current',
						}],
					},
				});
				var chain = ['ModifyResource', jsonapify.param('id')];
				modify(chain)(req, res, function(err) {
					if (err) return done(err);
					var resdata = JSON.parse(res._getData());
					expect(resdata).to.have.deep.property('data.field');
					expect(resdata.data.field).to.equal('current');
					done();
				});
			});
		});
		
		it('gives an error if the value does not exist', function(done) {
			model.create({}, function(err, object) {
				if (err) return done(err);
				common.initAccessor(accessors.field);
				common.initAccessor(accessors.output);
				var req = httpMocks.createRequest({
					params: { id: object._id.toString() },
					body: {
						data: [{
							op: 'replace',
							path: '/invalid',
						}],
					},
				});
				var chain = ['ModifyResource', jsonapify.param('id')];
				modify(chain)(req, res, function(err) {
					expect(err).to.exist;
					done();
				});
			});
		});
	});
	
	describe('move', function() {
		it('removes the value from path and adds it to the target location', function(done) {
			model.create({}, function(err, object) {
				if (err) return done(err);
				common.initAccessor(accessors.field, 'value');
				common.initAccessor(accessors.output);
				var req = httpMocks.createRequest({
					params: { id: object._id.toString() },
					body: {
						data: [{
							op: 'move',
							from: '/field',
							path: '/output',
						}],
					},
				});
				var chain = ['ModifyResource', jsonapify.param('id')];
				modify(chain)(req, res, function(err) {
					if (err) return done(err);
					var resdata = JSON.parse(res._getData());
					expect(resdata).to.not.have.deep.property('data.field');
					expect(resdata).to.have.deep.property('data.output');
					expect(resdata.data.output).to.equal('value');
					done();
				});
			});
		});
		
		it('gives an error if the value does not exist', function(done) {
			model.create({}, function(err, object) {
				if (err) return done(err);
				common.initAccessor(accessors.field);
				common.initAccessor(accessors.output);
				var req = httpMocks.createRequest({
					params: { id: object._id.toString() },
					body: {
						data: [{
							op: 'move',
							from: '/invalid',
							path: '/output',
						}],
					},
				});
				var chain = ['ModifyResource', jsonapify.param('id')];
				modify(chain)(req, res, function(err) {
					expect(err).to.exist;
					done();
				});
			});
		});
	});
	
	describe('copy', function() {
		it('copies the value from path to the target location', function(done) {
			model.create({}, function(err, object) {
				if (err) return done(err);
				common.initAccessor(accessors.field, 'value');
				common.initAccessor(accessors.output);
				var req = httpMocks.createRequest({
					params: { id: object._id.toString() },
					body: {
						data: [{
							op: 'copy',
							from: '/field',
							path: '/output',
						}],
					},
				});
				var chain = ['ModifyResource', jsonapify.param('id')];
				modify(chain)(req, res, function(err) {
					if (err) return done(err);
					var resdata = JSON.parse(res._getData());
					expect(resdata).to.have.deep.property('data.field');
					expect(resdata).to.have.deep.property('data.output');
					expect(resdata.data.field).to.equal('value');
					expect(resdata.data.output).to.equal('value');
					done();
				});
			});
		});
		
		it('gives an error if the value does not exist', function(done) {
			model.create({}, function(err, object) {
				if (err) return done(err);
				common.initAccessor(accessors.field);
				common.initAccessor(accessors.output);
				var req = httpMocks.createRequest({
					params: { id: object._id.toString() },
					body: {
						data: [{
							op: 'copy',
							from: '/invalid',
							path: '/output',
						}],
					},
				});
				var chain = ['ModifyResource', jsonapify.param('id')];
				modify(chain)(req, res, function(err) {
					expect(err).to.exist;
					done();
				});
			});
		});
	});
	
	describe('test', function() {
		it('tests that value at path is equal to value', function(done) {
			model.create({}, function(err, object) {
				if (err) return done(err);
				common.initAccessor(accessors.field, 'expected');
				common.initAccessor(accessors.output);
				var req = httpMocks.createRequest({
					params: { id: object._id.toString() },
					body: {
						data: [{
							op: 'test',
							path: '/field',
							value: 'expected',
						}],
					},
				});
				var chain = ['ModifyResource', jsonapify.param('id')];
				modify(chain)(req, res, function(err) {
					if (err) return done(err);
					var resdata = JSON.parse(res._getData());
					expect(resdata).to.have.deep.property('data.field');
					expect(resdata.data.field).to.equal('expected');
					done();
				});
			});
		});
		
		it('gives an error if values do not match', function(done) {
			model.create({}, function(err, object) {
				if (err) return done(err);
				common.initAccessor(accessors.field, 'value');
				common.initAccessor(accessors.output);
				var req = httpMocks.createRequest({
					params: { id: object._id.toString() },
					body: {
						data: [{
							op: 'test',
							path: '/field',
							value: 'invalid',
						}],
					},
				});
				var chain = ['ModifyResource', jsonapify.param('id')];
				modify(chain)(req, res, function(err) {
 					expect(err).to.exist;
					done();
				});
			});
		});
		
		it('gives an error if the value does not exist', function(done) {
			model.create({}, function(err, object) {
				if (err) return done(err);
				common.initAccessor(accessors.field);
				common.initAccessor(accessors.output);
				var req = httpMocks.createRequest({
					params: { id: object._id.toString() },
					body: {
						data: [{
							op: 'test',
							path: '/invalid',
							value: 'expected',
						}],
					},
				});
				var chain = ['ModifyResource', jsonapify.param('id')];
				modify(chain)(req, res, function(err) {
					expect(err).to.exist;
					done();
				});
			});
		});
	});
});
