app.factory('spotifycalls', ['$http', '$q', 'auth', function($http, $q, auth){

	var baseUrl = "https://api.spotify.com/v1/"
	var userCountry = 'ES';

	return {

		searchForArtist: function(artist){
			return $http.get(baseUrl + 'search?q=' + encodeURIComponent(artist) +'&type=artist&limit=50').then(function(response){
				return response.data;
			});
		},

		//	Create a new playlist to populate

		addPlaylist: function (playlistName, userId, access_token) {
			return $http({
		        method: "POST",
		        url: baseUrl + 'users/' + userId + '/playlists',
		        headers: {
		            'Authorization' : 'Bearer ' + access_token,
		            'Content-Type' : 'application/json'},
		        data: '{\"name\":\"'+ playlistName + '\", \"public\":true}'
		    }).then(function(response){
		    	return response.data;
		    });
		},

		// Return artists top10 tracks

		getTopTracks: function(artistId){
			return $http.get(baseUrl + 'artists/'+ artistId +'/top-tracks?country='+ userCountry).then(function(response){
				return response.data;
			});
		},

		addTracksToPlaylist: function(playlist_Id, tracks, userId, access_token) {
			playlist_Id = encodeURIComponent(playlist_Id);

			console.log("Playlist Id in addTracksToPlaylist = " + playlist_Id);

		    var userplaylist = 'https://open.spotify.com/user/'+ userId+'/playlist/'+playlist_Id;

		    //	Calculate how many calls needed to add all the tracks to the playlist
		    var numberOfCallsNeeded = Math.ceil(tracks.length/93);
		    var currentIndex = 0;
		    var trackSlices = [];
		    
		    //	Split tracks into arrays with 93 in each (The maximum that can be added to playlist without causing errors)

		    for(i=0;i < numberOfCallsNeeded; i++){
		    	trackSlices.push(tracks.slice(currentIndex,currentIndex + 93));
		    	currentIndex += 93;
		    }

		    //	Loop through trackSlices adding all the tracks to playlist

		    for(i = 0; i < numberOfCallsNeeded; i++){

		    	var trackUris = trackSlices[i].toString();
		    	console.log("in service trackUris = " + trackUris);

			    $http({
			      method: "POST",
			      url: baseUrl + 'users/'+ userId +'/playlists/'+ playlist_Id +'/tracks?uris='+ encodeURIComponent(trackUris),
			      headers: {
			          'Authorization' : 'Bearer ' + access_token,
			          'Accept' : 'application/json'}})
			    .then(function (r) {
			        console.log("success! :" + JSON.stringify(r));
			    })
			    .catch(function (error) {
			        console.log("failed to add tracks: " + JSON.stringify(error));

			    })
			}
		},
	};
}]);