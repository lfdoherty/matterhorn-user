
function getParameterByName(name) {

    var match = RegExp('[?&]' + name + '=([^&]*)')
                    .exec(window.location.search);

    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));

}

function makeCookie(cookie){

	var loc = document.location;

	var domainStr = (loc.hostname === 'localhost' ? '' : '; domain=' + loc.hostname);
	var newCookie = cookie + domainStr;

	document.cookie = 'SID='+newCookie;
}
