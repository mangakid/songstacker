app.factory('playlistservice', ['spotifycalls', '$q', function(spotifycalls, $q){
	return {
		getTracks: function(){
			
		},
		
		processRawTracks: function(data, numOfTracks, explicitAllowed){

			var processedArray = [];
			var newTracks = [];
			var trackUris = [];

		    var tempNumberOfTracks = numOfTracks;

		    if(!explicitAllowed){
		    	var nonExplicitArray = [];
		    	for(i = 0; i <data.tracks.length; i++){
		    		if(data.tracks[i].explicit === false){
		    			nonExplicitArray.push(data.tracks[i]);
		    		}
		    	}
		    	data.tracks = nonExplicitArray;
		    }

		    if(numOfTracks > data.tracks.length){
		      tempNumberOfTracks = data.tracks.length;
		    }
		    for(var i = 0; i < tempNumberOfTracks; i++){

				var newTrack = {artist:"",title:"",spotifyId:""};

				newTrack.title = data.tracks[i].name;
				newTrack.spotifyId = data.tracks[i].uri;
				newTrack.artist = data.tracks[i].artists[0].name;

				newTracks.push(newTrack);
				trackUris.push(data.tracks[i].uri);

		    }
		    processedArray.push(newTracks);
		    processedArray.push(trackUris);
		    return processedArray;

		},
	};
}])