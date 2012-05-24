
//TODO - lost password reset
//TODO - session expiry

//exports.dir = __dirname;
//exports.name = 'matterhorn-user';
//exports.requirements = ['matterhorn-standard'];

var sys = require('sys');

var mh = require('matterhorn');


require('matterhorn-standard');

var getUser = require('./internalmaker').getUser;

var _ = require('underscorem');



exports.secure = require('./ssluser');
exports.insecure = require('./insecureuser');

exports.getEmail = function(userId, cb){
	getUser().getEmail(userId, cb);
}

exports.hasSession = function(req, cb){
	var sid = req.cookies.sid;
	if(sid === undefined){
		cb(false);
	}else{
		getUser().checkSession(sid, function(ok, userId){
			cb(ok);
		});
	}
}

