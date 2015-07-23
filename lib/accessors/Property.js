var _ = require('lodash');

var InvalidFieldValue = require('../errors/InvalidFieldValue');

function Property(path) {
	this._path = path;
}

Property.prototype.adjustQuery = function(query, action) {
	var params = _.slice(arguments, 2);
	switch (action) {
	case 'select':
		query.select(this._path);
		return true;
	case 'sort':
		var order = params[0];
		var arg = _.set({}, this._path, order);
		query.sort(arg);
		return true;
	default:
		return false;
	}
};

Property.prototype.serialize = function(field, transaction, object, callback) {
	var value = _.get(object, this._path);
	callback(null, value);
};

Property.prototype.deserialize = function(field, transaction, resdata, object, callback) {
	_.set(object, this._path, resdata);
	callback(null, object);
};

module.exports = Property;