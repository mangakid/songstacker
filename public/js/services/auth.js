app.factory('auth', ['$http', '$q', function($http, $q){

	// function to generate state string for xsrf protection

	function generateRandomString(length) {
      var text = '';
      var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

      for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    };

    var redirect_uri = window.location + "callback.html" ; // Your redirect uri
    var state = generateRandomString(16);
    var client_id = '----';
    var stateKey = 'spotify_auth_state';
    var scope = 'user-read-private playlist-modify-private playlist-modify-public';
        
    var url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(client_id);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
    url += '&state=' + encodeURIComponent(state);
    

    return {

    	setState: function(){
    		window.sessionStorage.setItem(stateKey, state);
    	},

    	login: function(){
        var width = 450,
            height = 730,
            left = (screen.width / 2) - (width / 2),
            top = (screen.height / 2) - (height / 2);

    		window.open(url, 'Spotify',
            'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left);
    	},

      setAccessToken: function(access_token, expires_in){
          window.sessionStorage.setItem('accessToken', access_token);
          window.sessionStorage.setItem('expiresIn', (new Date()).getTime() + expires_in);
      },

      getAccessToken: function(){
        var expires = 0 + window.sessionStorage.getItem('expiresIn', '0');
        if ((new Date()).getTime() > expires) {
          return '';
        }
        var token = window.sessionStorage.getItem('accessToken', '');
        return token;
      },

      getStoredState: function(){
          return window.sessionStorage.getItem(stateKey);
      },
      getUserId: function(access_token){
          return $http({
                    method: "get",
                    url: 'https://api.spotify.com/v1/me',
                    headers: {'Authorization': 'Bearer '+ access_token}}).then(function(response){
                      return response.data;
                    });
      },
      setStoredUserId: function(userId){
        window.sessionStorage.setItem('userId', userId);
      },
      getStoredUserId: function(){
         var id = window.sessionStorage.getItem('userId', '');
         return id;
      },
    };

}])