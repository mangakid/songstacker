app.controller('HomeController', ['$scope', '$http', 'auth', 'spotifycalls', '$q', 'playlistservice', '$location', function($scope, $http, auth, spotifycalls, $q, playlistservice, $location) {

  $scope.searchField= "";
  $scope.artistMatches = [];
  $scope.artistTracks = []; //  For storing artist name, track name and spotify id.
  $scope.playlistName = "Songstacker Playlist";

  $scope.checkboxModel = { explicit: true,
                           open: true
                         };

  var currentMatch = "";
  var lastMatch = "";
  var splitSearch = [];
  var searched = {'searchString': '', 'results': false};
  var self = this;
  var start = 0;
  var end = 0;
  var searchString = "";

  self.showSearchField = true;
  self.showArtistResults = false;
  self.showPlaylistResults = false;
  self.searchedIndexes = [];

  self.hideAllFields = function(){
    self.showSearchField = false;
    self.showArtistResults = false;
    self.showPlaylistResults = false;
  }

  self.changeNumTracks = function(option){
    if(option === 'increase' && $scope.numberOfTracks < 10){
      $scope.numberOfTracks += 1;
    }
    else if(option === 'decrease' && $scope.numberOfTracks > 1){
      $scope.numberOfTracks -= 1;
    }
  }

  $scope.selected = function() {
    var count = 0;
    angular.forEach($scope.artistMatches,
      function(word) {
        count += word.checked ? 1 : 0;
      });
    return count;
  };

  $scope.searchFor = function(){

    start = 0;
    end = 0;
    currentMatch = "";
    lastMatch = "";
    window.sessionStorage.clear();
    window.sessionStorage.setItem("artists", JSON.stringify($scope.artistMatches));
    window.sessionStorage.setItem("playlistName", $scope.playlistName);
    $scope.artistMatches = [];
    var filteredSearchField = $scope.searchField.replace(/[\s\W\s+]/gi,' ');
    filteredSearchField = filteredSearchField.replace(/\s\s+/g, ' ');
    //filteredSearchField = filteredSearchField.replace(/\bAND\b/g, 'and');
    filteredSearchField = filteredSearchField.toLowerCase();
    splitSearch = filteredSearchField.split(" "); //Make an array of the search items
    console.log("splitSearch: " + splitSearch);
    if(splitSearch.length > 1){
    }
    searchString = splitSearch[0];
    spotifyArtistSearch();
  };

  function storeSearchedIndexes(s, e){
    var indexes = {
      start: s,
      end: e,
    };

    self.searchedIndexes.push(indexes);
  }

  function alreadySearchedSpotifyWithIndexes(s, e){
    var searchedAlready = false;
    for(var i = 0; i < self.searchedIndexes.length; i++){
      if(self.searchedIndexes[i].start == s && self.searchedIndexes[i].end == e){
        searchedAlready = true;
      }
    }
    return searchedAlready;
  }

  function moreArtistsToSearch(e){
    return e < splitSearch.length -1? true : false;
  }
                                                          //-----------  Below is the meat of the search algorithm -------//

  function spotifyArtistSearch(){
    if(searchString){
      
      while(alreadySearchedSpotifyWithIndexes(start,end) && moreArtistsToSearch(end)){
        end++;
      }

      storeSearchedIndexes(start, end);
      searchString = getNextSearchWord();
      console.log("Spotify http search -------------> " + searchString);
        spotifycalls.searchForArtist(searchString)
         .then(function(data){
  
           // Ensure no invalid entries
           var tempData = [];
           for(i = 0; i < data.artists.items.length; i++){
              if(data.artists.items[i]){
                tempData.push(data.artists.items[i]);
              }
           }
           $scope.artistData = tempData;
  
           $scope.artistData.sort(function(a,b) {return (a.popularity > b.popularity) ? -1 : ((b.popularity > a.popularity) ? 1 : 0);} );
  
           if($scope.artistData[0]){
            var spotifyBestMatch = $scope.artistData[0];
            spotifyBestMatch.checked = false;
            if(!artistAlreadyAdded(spotifyBestMatch)){
              $scope.artistMatches.push(spotifyBestMatch);
            }
           }
          
          if($scope.artistData.length > 0){                       //  <--- If results found search through results without further http calls
           searchResultsForMatch();
          } else {                                                //  <--- else no results found, make next http search
              console.log("No http results found, making next http search");
             updateMatchedWords();
             if(!alreadySearchedSpotifyWithIndexes(start, end)){
  
                searchString = getNextSearchWord();
                spotifyArtistSearch();
             } else if(moreArtistsToSearch(end)){
                if(start === end){
                  start++;
                  end++;
                } else {
                  start = end.valueOf();
                }
                searchString = getNextSearchWord();
                spotifyArtistSearch();
             }
          }
         })
         .catch(function(err) {
            console.log("Error: "+ JSON.stringify(err));
         });

   }
   else if($scope.artistMatches){
      if(currentMatch != lastMatch){
        currentMatch = lastMatch;
      }
      console.log("no more artists available to search so finishing up...");
      updateMatchedWords();
   }
  };

  
  function searchResultsForMatch(){

    console.log("search: " + searchString + " indexes: " + start +", " + end);
    currentMatch = getMatch(searchString);

    if(currentMatch){                             //  match found
      lastMatch = currentMatch;
      var newSearch = "";
      if(moreArtistsToSearch(end)){
        end++;
        newSearch = getNextSearchWord();
      } 
      if(newSearch !== searchString){
        searchString = newSearch;                                      //If next string available search again
        searchResultsForMatch();
      } else{
        end--;
        spotifyArtistSearch();                                            // Spotify search
      }
    } else {                         //  No match found so decide what string to spotify call with :
      if(start !== end){
        end -= 1;
      }
      
       console.log("no match found: " + searchString);
       searchString = getNextSearchWord();
       spotifyArtistSearch();
    }
  };
                                                                    //-----------  Above is the meat of the search algorithm -------//

  //  returns an exact or partial match of searchstring
    
  function getMatch(searchString){
    var exactCount = 0;
    var partialCount = 0;
    var matchFound = false;
    var match = "";

    while(matchFound === false && exactCount < $scope.artistData.length){ //  Look for exact match
      var name = $scope.artistData[exactCount].name.toLowerCase();
      if(searchString.toLowerCase() === name){
        match = $scope.artistData[exactCount];
        match.checked= true;
        matchFound = true;
      }
      exactCount += 1;
    }
    
    while(matchFound === false && partialCount < $scope.artistData.length){ //  Look for partial match

      var name = $scope.artistData[partialCount].name.toLowerCase();
      matchFound = findStringInString(searchString.toLowerCase(),name);

      if (matchFound){
        match = $scope.artistData[partialCount];
        match.checked = false;
      }

      partialCount += 1;
    }

    return match;
  };

  //  Helper function to find partial string match

  function findStringInString(string1,string2)
  {
    var match = false;
    if(string2.indexOf(string1) > -1)
    {
      match = true;
    }
    return match;
  }

  //  checks to see if artist is already added

  function artistAlreadyAdded(anArtist){
    var artistAdded = false;
    for(var i = 0; i < $scope.artistMatches.length; i++){
      if($scope.artistMatches[i].name == anArtist.name){
        return true;
      }
    }
    return artistAdded;
  };

  //  pushes latest match to artistMatches array if not already there

  function updateMatchedWords(){
    if(artistAlreadyAdded(lastMatch) == false){
      $scope.artistMatches.push(lastMatch);
    }
  };

  //  If available adds next string to current searchstring i.e: "red" -> "red hot" and returns result

  function getNextSearchWord(){
    var result = "";
    for(var i = start; i <= end; i++){
      result += (splitSearch[i] + " ");
    }
    return result.trim();
  }

                                      //-->>>> Most of the functions below are to get tracks from artist uris and make/add to playlist

  $scope.numberOfTracks = 3;
  var trackUrisArray =[]; //  Just stores uris
  var trackUris = "";

  var playlist_Id = "";

  function getTracks(){
    var deferred = $q.defer();
    
    var aTracks = [];

    for(var i = 0; i < $scope.artistMatches.length; i++){

      if($scope.artistMatches[i].checked === true){
        spotifycalls.getTopTracks($scope.artistMatches[i].id)
          .then(function(data){
            var processedData = processRawTracksData(data);
            aTracks.push(processedData);
          })
          .catch(function(err) {
            console.log("Error, unable to get top10 tracks for" + artistMatches[i].name + ", error: " + err);
        });
      }
    }

    deferred.resolve(aTracks);
    return deferred.promise;
  };

  function processRawTracksData(data){
    var processedArray = playlistservice.processRawTracks(data, $scope.numberOfTracks, $scope.checkboxModel.explicit);

    for(var i = 0; i < processedArray[1].length; i++){
      trackUrisArray.push(processedArray[1][i]);
    }
    return processedArray[0];
  };

  $scope.makePlaylist = function(){

    if(!$scope.isLoggedIn()){
      playlistservice.setWaiting(true);
      var p = $scope.logIn();
    }
    else{
      continueMakingPlaylist();
    }
  }

  $scope.$on('readyToMakePlaylist', function(event) {
    console.log("emit received from app controller, continuing making playlist");
    continueMakingPlaylist();
  });

  function continueMakingPlaylist(){

    playlistservice.setWaiting(false);

    trackUrisArray =[];
    $scope.userId = auth.getStoredUserId();
    $scope.access_token = auth.getAccessToken();

    var atLeastOneChecked = false;

    for(var i = 0; i< $scope.artistMatches.length;i++){
      if($scope.artistMatches[i].checked == true){
        atLeastOneChecked = true;
        break;
      }
    }
 
    if((atLeastOneChecked == true) && $scope.isLoggedIn()){

      var promise = getTracks();
      promise.then(function(aTracks){
        $scope.artistTracks = aTracks;
        
        spotifycalls.addPlaylist($scope.playlistName, $scope.userId, $scope.access_token, $scope.checkboxModel.open)
          .then(function(response){
            playlist_Id = response.id;
            console.log("artistMatches length = "+ $scope.selected() + " artist Tracks length = " + $scope.artistTracks.length);
            spotifycalls.addTracksToPlaylist(playlist_Id, trackUrisArray, $scope.userId, $scope.access_token);
          })
          .catch(function(err) {
            alert("Unable to create playlist " + JSON.stringify(err));
        });
      });
    }
  }

  $scope.openPlaylist = function(){
    var url =  'spotify:user:'+ $scope.userId+':playlist:'+playlist_Id;

    window.location.href = url;
  }

  $scope.isLoggedIn = function(){
    return (auth.getAccessToken() != '');
  };


  //  used to hide/show playlist generating form in index.html

  function countMatchedWords(){
    var count = 0;
    if ($scope.artistMatches.length === null){
      return count;
    }
    for(i=0;i < $scope.artistMatches.length;i++){
      count += $scope.artistMatches[i].name.split(" ").length;
    }
    return count;
  };

  $scope.logIn = function() {
    var deferred = $q.defer();
    auth.setState();
    auth.login();
    deferred.resolve();
    return deferred.promise;
  }

}]);