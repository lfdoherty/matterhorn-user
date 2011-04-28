
var bcrypt = require('bcrypt'),
	random = require('util/random'),
	_ = require('underscorem'),
	sys = require('sys');
	
function hashPassword(password, salt){
	var hash = bcrypt.hashpw(password, salt);
	return hash;
}

function make(userApplicationName, cb, useMonosy){

	if(arguments.length === 1){
		cb = arguments[0];
		userApplicationName = 'matterhorn-user';
	}else{
		_.assertLength(arguments, 2);
	}
	
	_.assertString(userApplicationName);
	_.assertFunction(cb);
	
	if(useMonosy){
	
		require('monosy').make(userApplicationName, function(monosyClient){

			require('monosy-iav').make(monosyClient, 'user-info', function(iav){

				require('monosy-sav').make(monosyClient, 'user-lookups', function(sav){
					require('monosy-counter').make(monosyClient, 'next-user-id', function(counter){
						finishMake(iav, sav, counter, cb);
					});
				});
			});
		});
	}else{
		require('jsonds').make('jsonds_user', 1000, function(jsonds){

			require('jsonds-iav').make(jsonds.root, 'user-info', function(iav){
				require('jsonds-sav').make(jsonds.root, 'user-lookups', function(sav){
					require('jsonds-counter').make(jsonds.root, 'next-user-id', function(counter){
						finishMake(iav, sav, counter, cb);
					});
				});
			});
		});		
	}
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
		setEmail: function(id, email){
			s.setInt(email, 'lookup-by-email', id);

			i.setString(id, 'email', email);
			i.setNumber(id, 'email-changed-time', Date.now());
		},
		getEmail: function(id, cb){
			i.getString(id, 'email', cb);
		},
		setPassword: function(id, password){

			var salt = bcrypt.gen_salt(10);  

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
					passed = bcrypt.compare(password, hash);
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
		}
	};
	
	cb(handle);
}

exports.make = make;
