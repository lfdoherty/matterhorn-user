
var bcrypt = require('bcrypt'),
	random = require('matterhorn-standard').random,
	_ = require('underscorem'),
	sys = require('sys');
	
function hashPassword(password, salt){
	var hash = bcrypt.hashSync(password, salt);
	return hash;
}

function make(userApplicationName, cb){

	if(arguments.length === 1){
		cb = arguments[0];
		userApplicationName = 'matterhorn-user';
	}else{
		_.assertLength(arguments, 2);
	}
	
	_.assertString(userApplicationName);
	_.assertFunction(cb);
	
	require('jsonds').make('jsonds_user', 1000, function(jsonds){

		var jsondsMonosy = require('jsonds-monosy');
		
		jsondsMonosy.iav(jsonds.root, 'user-info', function(iav){
			jsondsMonosy.sav(jsonds.root, 'user-lookups', function(sav){
				jsondsMonosy.counter(jsonds.root, 'next-user-id', function(counter){
					finishMake(iav, sav, counter, cb);
				});
			});
		});
	});		
}

function finishMake(i, s, userIdCounter, cb){

	var handle = {
		injectUser: function(id, email, passwordHash, passwordSalt){
		
			i.setLong(id, 'created-time', Date.now());
			s.setInt(email, 'lookup-by-email', id);
			i.setNumber(id, 'email-changed-time', Date.now());

			i.setString(id, 'salt', passwordSalt);
			i.setString(id, 'password-hash', passwordHash);
			i.setNumber(id, 'password-changed-time', Date.now());
			i.setBoolean(id, 'injected', true);
		},
		createUser: function(cb){
			userIdCounter.increment('userId');
			userIdCounter.get('userId', function(id){
				i.setNumber(id, 'created-time', Date.now());
				cb(id);
			});
		},
		createAuthenticationKey: function(email, cb){
			s.getString(email, 'authenticationKey', function(uid){
				if(uid !== undefined){
					s.del(uid, 'authenticationKey');
					console.log('deleting old authentication key');
				}
				
				var newUid = random.uid();
				s.setString(newUid, 'authenticationKey', email);
				s.setString(email, 'authenticationKey', newUid);
				cb(newUid);
			});
		},
		getAuthenticationKeyEmail: function(key, cb){
			s.getString(key, 'authenticationKey', cb);
		},
		expireAuthenticationKey: function(key){
			s.getString(key, 'authenticationKey', function(email){
				s.del(email, 'authenticationKey');
				s.del(key, 'authenticationKey');
			})			
		},
		setEmail: function(id, email){
			s.setInt(email, 'lookup-by-email', id);

			i.setString(id, 'email', email);
			i.setNumber(id, 'email-changed-time', Date.now());
		},
		getEmail: function(id, cb){
			i.getString(id, 'email', cb);
		},
		setPassword: function(id, password){

			var salt = bcrypt.genSaltSync(10);  

			i.setString(id, 'salt', 'BCRYPT');
			i.setString(id, 'password-hash', hashPassword(password, salt));
			i.setNumber(id, 'password-changed-time', Date.now());
		},
		authenticate: function(id, password, cb, failDelayCb){
			_.assertInt(id);
			console.log('in authenticate');
			i.getString(id, ['password-hash', 'salt'], function(hash, salt){

				console.log(arguments);

				var passed;
				if(salt === 'BCRYPT'){
					passed = bcrypt.compareSync(password, hash);
				}else{
					//TODO - also make sure to auto-upgrade here
					throw 'TODO - support legacy password hashes: ' + salt;
				}
				console.log('passed: ' + passed);
				if(passed){
					cb(true);
				}else{
					cb(false);
					//TODO set up fail delay
				}
			});
		},
		findUser: function(email, cb){
			s.getInt(email, 'lookup-by-email', cb);
		},
		makeSession: function(id){
			var session = random.make();
			s.setInt(session, 'sessions', id);
			return session;
		},
		checkSession: function(session, cb){
			_.assertString(session);
			s.getString(session, 'sessions', function(userId){
				if(userId === undefined){
					cb(false);
				}else{
					cb(true, userId);
				}
			});
		},
		clearSession: function(session){
			s.del(session, 'sessions');
			console.log('clearing user session');
		}
	};
	
	cb(handle);
}

exports.make = make;
