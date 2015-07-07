var _ = require('lodash');
var async = require('async');
var common = require('./common');
var Response = require('../response');

function enumerate(/* ...args */) {
	var args = _.slice(arguments);
	
	var opts = {};
	if (_.isPlainObject(_.last(args)))
		opts = args.pop();
	
	var pairs = _.chunk(arguments, 2);
	var last = pairs.pop();
	
	if (!_.isUndefined(opts.middleware) &&
	    !_.isArray(opts.middleware))
	    	opts.middleware = [opts.middleware];
	
	if (!_.isUndefined(opts.filters) &&
	    !_.isArray(opts.filters))
	    	opts.filters = [opts.filters];
	
	function queryModel(model, filter, req, response, cb) {
		var query = model.find(filter);
		if (!_.isUndefined(opts.filters)) {
			query = opts.filters.reduce(function(acc, f) {
				return f(acc, req, response);
			}, query);
		}
		return query.exec(cb);
	}
	
	function getResourceData(req, response, cb) {
		common.applySelectors(pairs, req, function(err, parent) {
			var resource = last[0];
			var selector = last[1];
			var filter = common.resolveSelector(selector, req, parent);
			queryModel(resource.model, filter, req, response, function(err, results) {
				err ? cb(err) : cb(null, resource, results);
			});
		});
	}
	
	function middleware(req, res, next) {
		var response = new Response;
		response.link('self', req.originalUrl);
		getResourceData(req, response, function(err, resource, results) {
			if (err) return next(err);
			response.meta('count', results.length);
			common.wrapResults(resource, results, response, function(err, resdata) {
				if (err) return next(err);
				response.data(resdata);
				res.json(response);
				next();
			});
		});
	}
	
	return !_.isUndefined(opts.middleware)
	           ? opts.middleware.concat(middleware)
	           : middleware;
}

module.exports = enumerate;