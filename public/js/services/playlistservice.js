app.factory('playlistservice', ['spotifycalls', '$q', function(spotifycalls, $q){
	return {
		getTracks: function(){
			
		},
		
		processRawTracks: function(data, numOfTracks, explicitAllowed){

			var processedArray = [];
			var newTracks = [];
			var trackUris = [];

		    var tempNumberOfTracks = numOfTracks;

		    if(numOfTracks > data.tracks.length){
		      tempNumberOfTracks = data.tracks.length;
		    }
		    for(var i = 0; i < tempNumberOfTracks; i++){

		        var newTrack = {artist:"",title:"",spotifyId:""};
		        var isExplicit = data.tracks[i].explicit;

		        newTrack.title = data.tracks[i].name;
		        newTrack.spotifyId = data.tracks[i].uri;
		        newTrack.artist = data.tracks[i].artists[0].name;
		        //console.log("isExplicit? " + data.tracks[i].explicit);
		        if(isExplicit === explicitAllowed)
		        {
		          //console.log("track explicit and explicit checkbox = true");
		          newTracks.push(newTrack);
		          trackUris.push(data.tracks[i].uri);
		        } 
		        else if(isExplicit === false){
		          //console.log("track not explicit");
		          newTracks.push(newTrack);
		          trackUris.push(data.tracks[i].uri);
		        }
		    }
		    processedArray.push(newTracks);
		    processedArray.push(trackUris);
		    return processedArray;

		},
	};
}])