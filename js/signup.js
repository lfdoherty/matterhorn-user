


$(document).ready(function(){

	$("#submit").click(function(){
		
		var email = $("#email").val();
		var password = $("#password").val();

		var json = {email: email, password: password};

		function ok(cookie){
			
			makeCookie(cookie);
			
			var next = getParameterByName('next');
			if(!next){
				next = '/';
			}
			document.location = 'http://' + document.location.hostname + next;
		}

		function fail(){
			alert('registration failure');
		}

		pollsave(json, '/ajax/signup', 200, ok, fail);
	});
});
