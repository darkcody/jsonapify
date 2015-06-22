# jsonapify

Middleware for easy development of JSON-API compatible APIs

## Install

```bash
$ npm install jsonapify
```

## Sample code

```js
var auth = require('../auth');
var express = require('express');
var passport = require('passport');
var jsonapify = require('jsonapify');

var User = require('./models/user');
var userResource = new jsonapify.Resource(User, {
	id: jsonapify.field('_id'),
	type: 'users',
	attributes: {
		name: jsonapify.field('name.full'),
		password: jsonapify.field('password', { readable: false }),
	},
});

var router = express.Router();
router.get('/', jsonapify.enumerate(userResource), {
	middleware: [
		auth.authenticateAccessToken(),
		auth.requirePrivilege('user:enum'),
	],
});

module.exports = router;
```
