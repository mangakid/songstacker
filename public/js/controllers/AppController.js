app.controller('AppController', ['auth', '$location', '$scope', 'playlistservice', function(auth, $location, $scope, playlistservice) {

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
					if(playlistservice.getWaiting() === true){
						console.log("waiting to make playlist = true, emitting ready to make playlist");
						$scope.$broadcast('readyToMakePlaylist');  
					}
				})
				.catch(function (error){
					console.log("error " + error);
				});

				$scope.$apply();
			}
  		}, false);

}]);