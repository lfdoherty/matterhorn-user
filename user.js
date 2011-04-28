
//TODO - lost password reset
//TODO - session expiry

exports.dir = __dirname;
exports.name = 'matterhorn-user';


var express = require('express');

var sys = require('sys');

require('matterhorn-ajax');
require('matterhorn-jquery');

var internal = require('./internal');

var _ = require('underscorem');

function setSessionCookie(res, session){
	res.cookie('SID', session, {httpOnly: true, secure: true});
}

var user;
internal.make('matterhorn-user', function(internal){

	user = internal;
});

function getSid(req){
	if(!req.headers.cookie || req.headers.cookie.indexOf('SID=') === -1) return;
	
	return req.headers.cookie.substr(4, req.headers.cookie.length);
}
exports.authenticate = function(req, res, next){

	var sid = getSid(req);

	function doLoginRedirect(){
		sys.debug(sys.inspect(req));
		var url = secureApp.settings.securehost + '/login?next=' + req.url;
		sys.debug('redirecting to ' + url);
		res.redirect(url);
	}

	if(sid === undefined){
		doLoginRedirect();
		return;
	}

	user.checkSession(sid, function(ok, userId){
		if(ok){
			user.getEmail(userId, function(email){
				req.user = {id: userId, email: email};
				next();
			});
		}else{
			sys.debug('redirecting to login');
			doLoginRedirect();
		}
	});
}

//set up services for signup, login, logout, and lost password reset.
//all to be accessed via AJAX (these are not HTML resources.)

secureApp.post(exports, '/ajax/signup', function(req, res){

	var data = req.body;

	user.createUser(function(userId){
		user.setEmail(userId, data.email);
		user.setPassword(userId, data.password);

		var session = user.makeSession(userId);

		setSessionCookie(res, session);

		res.send(session);
	});
});

secureApp.post(exports, '/ajax/login', function(req, res){

	var data = req.body;

	console.log('/ajax/login request received: ' + data.email);

	user.findUser(data.email, function(userId){
		console.log('found user: ' + userId);
		if(userId === undefined){
			res.send({
				error: 'authentication failed'
			}, 403);
		}else{
			sys.debug('found user: ' + userId);
			user.authenticate(userId, data.password, function(ok){
	
				if(ok){
					var session = user.makeSession(userId);
			
					setSessionCookie(res, session);
					res.send(session);
					
				}else{
					res.send({
						error: 'authentication failed'
					}, 403);
				}
			});
		}
	});
});

secureApp.post(exports, '/ajax/logout', function(req, res){

	var sid = getSid(req);

	if(sid !== undefined){
		user.clearSession(sid);
		res.clearCookie('SID');
	}

	res.send({result: 'ok'});	
});

secureApp.js(exports, 'auth-utils', ['utils']);

var loginPage = {
	css: ['simple_user'],
	js: ['jquery-1.5', 'auth-utils', 'ajax', 'login'],
};	
var signupPage = {
	css: ['simple_user'],
	js: ['jquery-1.5', 'auth-utils', 'ajax', 'signup'],
};	
secureApp.template(exports, 'simple_login', loginPage);
secureApp.template(exports, 'simple_signup', signupPage);

secureApp.get(exports, '/login', function(req, res){
	sys.debug('got login request, next: ' + req.query.next);
	secureApp.apply(res, 'simple_login', {after: req.query.next});
});
secureApp.get(exports, '/signup', function(req, res){
	secureApp.apply(res, 'simple_signup', {});
});




