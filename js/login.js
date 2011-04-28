
$(document).ready(function(){

	$("#submit").click(function(){
		
		var email = $("#email").val();
		var password = $("#password").val();

		var json = {email: email, password: password};

		function ok(cookie){

			var loc = window.location;

			makeCookie(cookie);
			
			$("#result").append("Login Successful");
			
			window.location = 'http://' + window.location.host + afterLoginUrl;
		}

		function fail(){
			alert('login failure');
		}

		pollsave(json, '/ajax/login', 200, ok, fail);
	});
	
	var next = getParameterByName('next');

	if(next){
		var signup = $('#signuplink');
		signup.attr('href', signup.attr('href')+'?next='+next);
	}
});
