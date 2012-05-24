var internal = require('./internal');

var user;
exports.getUser = function(){
	return user;
}
internal.make('matterhorn-user', function(ii){

	user = ii;
});


