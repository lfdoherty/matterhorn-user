


jQuery(document).ready(function(){

	jQuery("#submit").click(function(){
		
		var email = jQuery("#email").val();
		var password = jQuery("#password").val();

		var json = {email: email, password: password};

		function ok(res){
			
			res = JSON.parse(res)
			
			makeCookie(res.token, res.userId);
			
			var next = getParameterByName('next');
			if(!next){
				next = '/';
			}
			document.location = 'http://' + document.location.hostname + ':' + port + next;
		}

		function fail(err){
			alert('registration failure: ' + err.error);
		}

		pollsave(json, '/ajax/signup', 200, ok, fail);
	});
});
