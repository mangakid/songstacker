app.controller('AppController', ['auth', '$location', '$scope', function(auth, $location, $scope) {

	$scope.isLoggedIn = function(){
		return (auth.getAccessToken() != '');
	};

	window.addEventListener("message", function(event) {
			console.log('got postmessage', event);
			var hash = JSON.parse(event.data);
			if (hash.type == 'access_token') {
				console.log("setting access token from hash");
				auth.setAccessToken(hash.access_token, hash.expires_in || 60);
				$scope.state = hash.state;
				console.log("hashed state = " + $scope.state);

				auth.getUserId(hash.access_token)
				.then(function(data){
					auth.setStoredUserId(data.id);
					console.log("Storing userId in AppController : " + data.id);
				})
				.catch(function (error){
					console.log("error " + error);
				});
				$scope.$apply();
			}
  		}, false);

}]);