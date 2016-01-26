app.controller('HomeController', ['$scope', '$http', 'auth', 'spotifycalls', '$q', 'playlistservice', function($scope, $http, auth, spotifycalls, $q, playlistservice) {

  $scope.searchField= "";
  $scope.artistMatches = [];
  $scope.artistTracks = []; //  For storing artist name, track name and spotify id.
  $scope.playlistName = "Songstacker Playlist";
  $scope.checkboxModel = { explicit: true };


  var currentMatch = "";
  var lastMatch = "";
  var nextString = "";
  var lastString = "";
  var splitSearch = [];
  //  var httpCallCount = 0;
  var lastHttpCall = "";
  var lastResultsSearch = "";
  var nextStringIndex = 0;
  var searched = {'searchString': '', 'results': false};
  

  $scope.selected = function() {
    var count = 0;
    angular.forEach($scope.artistMatches,
      function(word) {
        count += word.checked ? 1 : 0;
      });
    return count;
  };

  $scope.searchFor = function(){
    
    currentMatch = "";
      lastMatch = "";
      nextString = "";
      lastString = "";
      //httpCallCount = 0;
      lastHttpCall = "";
      lastResultsSearch = "";
      window.sessionStorage.clear();
      window.sessionStorage.setItem("artists", JSON.stringify($scope.artistMatches));
      window.sessionStorage.setItem("playlistName", $scope.playlistName);
      $scope.artistMatches = [];
      var filteredSearchField = $scope.searchField.replace(/[\s\W\s+]/gi,' ');
      filteredSearchField = filteredSearchField.replace(/\s\s+/g, ' ');
      $scope.searchedWords = [];
      splitSearch = filteredSearchField.split(" "); //Make an array of the search items
      if(splitSearch.length > 1){
        nextString = splitSearch[1];                //Next string assigned
        nextStringIndex = 1;                        //Next sting index assigned
      }
      spotifyArtistSearch(splitSearch[0]);
      //httpSearch(splitSearch[0]);
    }

    function spotifyArtistSearch(searchString){
      if(searchString/* && httpCallCount < 150 && $scope.searchedWords.indexOf(searchString) === -1 && countMatchedWords() <= splitSearch.length*/){
        $scope.searchedWords.push(searchString);
        lastHttpCall = searchString;
        //  console.log("Making spotify http call with "+ searchString + ", httpcall count = "+ httpCallCount);
        spotifycalls.searchForArtist(searchString)
         .then(function(data){
           //httpCallCount += 1;
           // console.log("spotify search success");

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
            if(artistAlreadyAdded(spotifyBestMatch) == false){
              $scope.artistMatches.push(spotifyBestMatch);
            }
           }


           if($scope.artistData.length > 0){ //If results found
             //console.log("Results found");
             searchResultsForMatch(searchString);
           }

           else{
             updateMatchedWords();
             // console.log("No http results found so matched words updated from httpSearch()");
             var indexOfSearchString = splitSearch.indexOf(searchString);

             if(indexOfSearchString != -1){ //If searchstring was just one word

               if(nextString/*&& httpCallCount < 150*/){   //and httpsearch again with next string
                 // console.log("calling http with next string, httpcount = " + httpCallCount);
                 searchString = nextString;
                 nextString = splitSearch[nextStringIndex +1]; //Make next string, next string in split search array  -- Next string assigned
                 nextStringIndex += 1;
                 
                 spotifyArtistSearch(searchString);
               }
             }

              //Search string was more than one word and last string has not been httpSearched
             else if(lastString/* && httpCallCount < 150*/ && $scope.searchedWords.indexOf(lastString) === -1){   //  httpsearch again with last word in searchString
                 // console.log("httpcall with lastString: " + lastString + ", nextString = "+ nextString);
                 spotifyArtistSearch(lastString);
               }
               //Search string was more than one word, but last string has been httpsearched already httpsearch with next string
             else if(nextString){
                searchString = nextString;
                nextString = splitSearch[nextStringIndex +1]; //Make next string, next string in split search array       -- Next string assigned
                nextStringIndex += 1;
                spotifyArtistSearch(searchString);
             }
           }
         })
         .catch(function(err) {
            //  httpCallCount += 1;

            console.log("Error: "+ JSON.stringify(err));
         });
     }
     else if($scope.artistMatches/* != null*/){
        if(currentMatch != lastMatch){
          currentMatch = lastMatch;
        }
        updateMatchedWords();
        //getTracks();
        //console.log($scope.artistTracks);
     }
    }

    
    function searchResultsForMatch(searchString){
      //  console.log("searching results for match with: " + searchString);
      currentMatch = getMatch(searchString);

      //  console.log("Last Match was: "+ lastMatch.name +", current match = "+ currentMatch.name);

      if(currentMatch){                             //matchfound
        //  console.log("last match was " + lastMatch.name + ", current match is: "+ currentMatch.name );
        lastMatch = currentMatch;
        var newSearch = addNextWord(searchString);
        if(newSearch != searchString){                                            //If next string available search again
          lastResultsSearch = searchString;                                       //LastResultsSearch assigned
          //  console.log("searching again with next word: "+ newSearch);
          searchResultsForMatch(newSearch);
        }
        else{
          if(lastHttpCall != searchString){
            //httpSearch(searchString);
            //  console.log("lasthttpcall != searchString so Making http call with: " + searchString);
            
            spotifyArtistSearch(searchString);
          }
          else{
            //  console.log("Last http call === searchString so updating matched words");
            updateMatchedWords();
          }
        }
      }

      else{ //No match found so decide what string to spotify call with :
        //  console.log("No match found in internal search");
        //  last spotify call not equal to last match search? then spotify call with last match search 
        if(lastHttpCall != lastResultsSearch/* && $scope.searchedWords.indexOf(lastHttpCall) === -1*/){
          //  console.log("Calling http with lastResultsSearch: "+ lastResultsSearch);
          nextString = lastString;                                                 //Next string assigned
          nextStringIndex += -1;                                                   //Next string index assigned
          //lastString = splitSearch[nextStringIndex -1]

          spotifyArtistSearch(lastResultsSearch);
          //httpSearch(lastResultsSearch);
        }
        //  last spotify call equal to last match search so if not search string in searched words spotify call with search string
        else if($scope.searchedWords.indexOf(searchString) === -1){
          //  console.log("calling http with searchString: "+ searchString);
          spotifyArtistSearch(searchString);
          //httpSearch(searchString);
        }
        //  search string in searched words so spotify search with next string if available
        else if(nextString/* && httpCallCount < 150*/){   //and httpsearch again with next string
           // console.log("calling http with next string, httpcount= " + httpCallCount);
           searchString = nextString;
           nextString = splitSearch[nextStringIndex +1]; //Make next string, next string in split search array       //Next string assigned
           nextStringIndex += 1;                                                                                     //Next string index assigned -- (NEW)
           spotifyArtistSearch(searchString);
         }
      }
    }
    
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
  }

  //  returns an exact or partial match of searchstring
    
  function getMatch(searchString){
    var exactCount = 0;
    var partialCount = 0;
    var matchFound = false;
    var match = "";
    //console.log("in getMatch");

    while(matchFound === false && exactCount < $scope.artistData.length){ //  Look for exact match
      var name = $scope.artistData[exactCount].name.toLowerCase();
      if(searchString.toLowerCase() === name){
        //  console.log("Exact match found: "+ searchString + " = " + $scope.artistData[exactCount].name);
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
        //  console.log("Partial match found: "+ match.name);
      }

      partialCount += 1;
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
  }

  //  pushes latest match to artistMatches array if not already there

  function updateMatchedWords(){
    if(artistAlreadyAdded(lastMatch) == false){
      //  console.log("Updating artistMatches: "+ lastMatch.name);
      //  lastMatch.checked=true;

      $scope.artistMatches.push(lastMatch);
    }
  }

  //  If available adds next string to current searchstring i.e: "red" -> "red hot" and returns result

  function addNextWord(searchString){
    var newSearch = "";
    //  console.log("addNextWord: creating next searchString");
    lastString = nextString;
    //  console.log("addNextWord: Next string is: "+ nextString);
    if(nextString/* != null && nextString != ""*/){
      newSearch = searchString.concat(" ",nextString);
      //  console.log("addNextWord: New search string is: " + newSearch);
    }
    else{
      var newSearch = searchString;
      //  console.log("No next string, so newSearch: "+ newSearch);
    }
    nextStringIndex += 1; //  Next sting index assigned
    nextString = splitSearch[nextStringIndex];  //  Next string assigned
                                           
    return newSearch;
  }

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
      
  var numberOfTracks = 1;
  var trackUrisArray =[]; //  Just stores uris
  var trackUris = "";

  var playlist_Id = "";

  function getTracks(){
    var deferred = $q.defer();
    
    var aTracks = [];

    if($scope.artistMatches.length <= 9){
      numberOfTracks = 10;
    }
    else{
      numberOfTracks = 3;
    }

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
    var processedArray = playlistservice.processRawTracks(data, numberOfTracks, $scope.checkboxModel.explicit);

    for(var i = 0; i < processedArray[1].length; i++){
      trackUrisArray.push(processedArray[1][i]);
    }
    return processedArray[0];
  };

  $scope.makePlaylist = function(){

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
        spotifycalls.addPlaylist($scope.playlistName, $scope.userId, $scope.access_token)
          .then(function(response){
            playlist_Id = response.id;
            spotifycalls.addTracksToPlaylist(playlist_Id, trackUrisArray, $scope.userId, $scope.access_token);
          })
          .catch(function(err) {
            alert("Unable to create playlist " + err);
        });
      });
    }
  }

  $scope.openPlaylist = function(){
    var url =  'spotify:user:'+ $scope.userId+':playlist:'+playlist_Id;

    window.location.href = url;
  }

  $scope.tweetPlaylist = function(){
    var url = 'https://twitter.com/intent/tweet?text=I%20just%20made%20this%20playlist:%20' + $scope.userplaylist + '%20using%20www.songstacker.com%20%23songstacker%20%23spotify%20%23playlist%20';

    window.open(url);
  }


  $scope.logIn = function() {
    auth.setState();
    auth.login();
  }

}]);