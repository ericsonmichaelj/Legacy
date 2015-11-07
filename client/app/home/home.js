(function() {
'use strict';

var app = angular.module('myApp.home', ['ngRoute', 'ngMaterial', 'ngAnimate', 'ngMdIcons', 'btford.socket-io', 'btford.socket-io'])

     
var serverBaseUrl = 'http://localhost:8080'; //ec2-54-175-174-234.compute-1.amazonaws.com

app.factory('socket', function (socketFactory) {
    var myIoSocket = io.connect(serverBaseUrl);

    var socket = socketFactory({
        ioSocket: myIoSocket
    });

    return socket;
});

//custom directive for sending message on enter - ng-enter in template
app.directive('ngEnter', function () {
  //define the link function, which allows us to manipulate the DOM
    return function (scope, element, attributes) {
        //bind the keydown keypress event, the the DOM element our directive is associated with
        element.bind("keydown keypress", function (event) {
            //if it's enter key
            if (event.which === 13) {
                //then, with the current scope...
                scope.$apply(function () {
                    //evaluate the function passed into our ngEnter directive, (send in our case)
                    //with whatever the arguments are that are passed into our ngEnter's function, (message in our case)
                    //attriubutes are the attributes of our target element, this = message in our case
                    scope.$eval(attributes.ngEnter);
                });
                //prevent default behaviour of form
                event.preventDefault();
            }
        });
    };
});

app.controller('homeController', ['$scope', '$log', '$http', '$mdDialog', 'socket',  function($scope, $log, $http, $mdDialog, socket) {

     $scope.messages = [];
     $scope.room = "default";
     $scope.username = "sonny";
 //server opens connection, when client connects, setup event is called, load rooms   
socket.on('setup', function (data) {
        var sports = data.sports;
  
        $scope.sports = sports

        var roomsArray = new Array;
        for (var key in sports){
          roomsArray.push(sports[key])
        }
    
        $scope.rooms = roomsArray;
      });

socket.on('message created', function (data){
 $scope.messages.unshift(data)

});

//function to handle activity when room/sport is changed
$scope.changeRoom = function(clickedRoom){
  $scope.room = clickedRoom.toUpperCase();
  //emit the switch room signal to the server with the clicked room
  socket.emit('switch room', {
    newRoom: clickedRoom
  });
  $http.get(serverBaseUrl + '/msg?room=' + clickedRoom).success(function(msgs){
    $scope.messages = msgs;
  });


};


//function to call when enter key hit, it emits a signal back to the server
$scope.send = function(msg){
 socket.emit('new message',{
   room: $scope.room,
   message: msg,
   username: $scope.username
 });

 $scope.message= ""
}
 

console.log('hello homepage')
// $SCOPE VARIABLES
  
  $scope.map;
  $scope.userPosition;
  $scope.sitesResults;
  $scope.currentKeyword;
  $scope.clickedPosition;
  $scope.currentRankByFlag;
  $scope.checkins;

  $scope.TransportationCategory= {
    "Driving": "car",
    "Walking": "male",
    "Bicycling":"bicycle",
    "Transit":"bus"
  }
  $scope.sports = {
    'Basketball': 'Basketball Court',
    'Soccer': 'Soccer Field',
    'Tennis': 'Tennis Court',
    'Baseball': 'Baseball Field',
    'Softball': 'Softball Field',
    'Gym': 'Gym',
    'Rock-Climbing': 'Climbing Gym',
    'Golf': 'Golf Course',
    'Racquetball': 'Racquetball Court',
    'Squash': 'Squash Court'
  };

// OTHER VARIABLES
  var transportation = "DRIVING";

  var defaultLocation = {  // this is SF
    lat: 37.7833,
    lng: -122.4167
  };
  var userMarkerImage = '../assets/images/centerflag.png';
  var blueDotImage = '../assets/images/bluedot.png';
  var sportIcons = {
    'Basketball Court': '../assets/images/basketball.png',
    'Soccer Field': '../assets/images/soccer.png',
    'Tennis Court': '../assets/images/tennis.png',
    'Baseball Field': '../assets/images/baseball.png',
    'Softball Field': '../assets/images/softball.png',
    'Gym': '../assets/images/gym.png',
    'Climbing Gym': '../assets/images/climbing.png',
    'Golf Course': '../assets/images/golf.png',
    'Racquetball Court': '../assets/images/racketball.png',
    'Squash Court': '../assets/images/squash.png'
  };
  var markers = [];
  var infowindow;
  var geocoder;
  var userMarker;
  var searchLocation;
  var currentDestination;

//DIRECTIONS AND DISTANCE FUNCTIONS

  function getDirections(destination){
    var directionsService = new google.maps.DirectionsService;
    directionsService.route({
      origin: $scope.userPosition,
      destination: destination,
      travelMode: google.maps.TravelMode[transportation]

    },function(response,status){
       if (status === google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response)
      }else {
        console.log("Direction request failed")
      }
    })
  }
  function getDistanceandDuration(destination,element){
    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins : [$scope.userPosition],
      destinations : [destination],
      travelMode: google.maps.TravelMode[transportation]
    },DistanceMatrixServiceCallback)
    function DistanceMatrixServiceCallback(response,status){
      $scope.sitesResults[element].distance = response.rows[0].elements[0].distance.text;
      $scope.sitesResults[element].duration =response.rows[0].elements[0].duration.text;
    } 
  }


// CHANGE USER'S LOCATION
  $scope.SelectTransportation = function(base,icon){
    $scope.SelectedIcon = icon;
    $scope.SelectedBase = base;
    transportation = base.toUpperCase();
    console.log(currentDestination);
    getDirections(currentDestination);
    _.each($scope.sitesResults,function(result,element){
       var placeLoc = result.geometry.location;
      var placeLng = placeLoc.lng();
      var placeLat = placeLoc.lat();
      var destination = {lat:placeLat,lng:placeLng};
      getDistanceandDuration(destination,element);     
    });


  };
  $scope.changeLocation = function(locationData) {
    geocoder = new google.maps.Geocoder();  // init Geocoder

    locationData = $('#location-search').val();  // get the auto-complete address

    geocoder.geocode(    // get LatLng for given address
      {'address': locationData},
      function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          getMap(results[0].geometry.location, 14);  // redraw map with new location
          drawUserMarker(results[0].geometry.location);  // draw a new marker in the center of the map
          $scope.clickedPosition = results[0].geometry.location;  // searches will now be around the new marker
        } else {
          alert('Location change failed because: ' + status);
        }
    });
  };

// CREATE A PERSISTENT USER MARKER
  var drawUserMarker = function(position) {
    if (position === undefined) {
      position = $scope.map.getCenter();
    }

    userMarker = new google.maps.Marker({  // define new center marker
      position: position,
      icon: userMarkerImage
    });


    userMarker.setMap($scope.map);  // set the new center marker
  };

// DRAW A MAP WITH USER MARKER, ADD EVENT LISTENER TO REDRAW USER MARKER
  var getMap = function(latLngObj, zoomLevel) {
    $scope.map = new google.maps.Map(document.getElementById('map'), {  // draw map
      center: latLngObj,
      zoom: zoomLevel,
      disableDoubleClickZoom: true
    });



    infowindow = new google.maps.InfoWindow();  // init infowindow

    $scope.map.addListener('dblclick',  // double-click to set a flag
      function(event) {
        if (userMarker) {
          userMarker.setMap(null);
        }
        drawUserMarker(event.latLng);
        $scope.clickedPosition = event.latLng;
    });
  };

  $scope.directionDisplay = function(){   
    window.directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setOptions({options:{suppressMarkers:true,preserveViewport:true}})
    directionsDisplay.setMap($scope.map)
    directionsDisplay.setPanel(document.getElementById("direction-display"));
  }

  $scope.directionDisplay2 = function(){   
    directionsDisplay.setPanel(document.getElementById("direction-display"));
  }
// GEOLOCATE USER'S POSITION
  $scope.userfind = function() {
    getMap(defaultLocation, 12);  // draw map with default location

    if (navigator.geolocation) {  // attempt geolocation if user allows
      navigator.geolocation.getCurrentPosition(function(position) {
        $scope.userPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        var blueDotMarker = new google.maps.Marker({  // create blueDot marker for user's position
          position: $scope.userPosition,
          animation: google.maps.Animation.DROP,
          icon: blueDotImage
        });
        blueDotMarker.setMap($scope.map);  // set the blueDot marker

        $scope.map.setCenter($scope.userPosition);  // reset map with user position and closer zoom
        $scope.map.setZoom(14);
      },
      function() {  // error, but browser supports geolocation
        handleLocationError(true, infoWindow, $scope.map.getCenter());
      });
    } else {  // error, browser doesn't support geolocation
      handleLocationError(false, infoWindow, $scope.map.getCenter());
    }

     $scope.$apply();  // force update the $scope

    function handleLocationError(browserHasGeolocation, infoWindow, pos) {  // this is specific to geolocation
      infoWindow.setPosition(pos);
      infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    }
  };

// CREATE MARKERS FOR SITES
  $scope.createMarker = function(place, keyword,element) {
    var placeLoc = place.geometry.location;
    var placeLng = placeLoc.lng();
    var placeLat = placeLoc.lat();
    var placeVicinity = place.vicinity;
    var placeName = place.name;
    var placeOpenNow;
    var placeOpenNowClass;

    //THIS STARTS THE INPUT NECESSARY TO FIND THE DISTANCE!
    var destination = {lat:placeLat,lng:placeLng};
    var origin = $scope.userPosition;
    getDistanceandDuration(destination,element)
    if (place.opening_hours && place.opening_hours.open_now) {  // not all Places have opening_hours property, will error on variable assign if they don't
      placeOpenNow = 'Open to play right now!';
      placeOpenNowClass = 'open';
    } else if (place.opening_hours && !place.opening_hours.open_now) {
      placeOpenNow = 'Closed now, but check back again!';
      placeOpenNowClass = 'closed';
    } else {
      placeOpenNow = '';
      placeOpenNowClass = 'unknown';
    }

    var iconMarkerImg = sportIcons[keyword];  // see the sportIcons object at top



    var marker = new google.maps.Marker({  // draw the marker on the map
      map: $scope.map,
      position: place.geometry.location,
      animation: google.maps.Animation.DROP,
      icon: iconMarkerImg
    });
    marker.addListener('click', function() { // add event listener for each marker
      $('*[data-placeId] .sitename').css("font-weight", "normal");  // make text for list item bold
      $('*[data-placeId=' + place.place_id + '] .sitename').css("font-weight", "bold");
      currentDestination = destination;
      getDirections(destination);
      infowindow.setContent('<div class="infowindow-name">' + placeName + '</div><div class="infowindow-open ' + placeOpenNowClass + '">' + placeOpenNow + '</div><div class="infowindow-vicinity">' + placeVicinity + '</div');
      infowindow.open($scope.map, this);  // infowindow popup

    });

    markers.push(marker); // add each marker to markers array
  };

// CLICK EVENT LISTENER FOR SITE LIST
  $scope.siteListClick = function($index) {
    google.maps.event.trigger(markers[$index], 'click'); // trigger click event on respective marker
  };

// POPULATE SITE LIST FOR SELECTED SPORT
  $scope.populateList = function(keyword, sport, rankByFlag) {
    /* We killed the "rankBy / orderBy" functionality because the results didn't seem to make much sense.
    /* Google says RankBy.DISTANCE should give the closest results, but that doesn't seem to match up.
    /* To reinstate: add a way to select between DISTANCE/PROMINENCE in the UI, then use the rankByFlag
    /* to toggle, according to the code below.  */

    $scope.currentRankByFlag = rankByFlag;
    $scope.selectedSport = sport;

    if (keyword !== undefined) { // if keyword is passed in, save it
      $scope.currentKeyword = keyword;
    }
    if ($scope.clickedPosition === undefined) {  // if no flag set, search around center of map
      searchLocation = $scope.map.getCenter();
    } else {  // otherwise search around flag
      searchLocation = $scope.clickedPosition;
    }
    
    var request = {
      location: searchLocation,  // determine current center of map
      keyword: [keyword]  // keyword to search from our search object
    };

    if (rankByFlag) {
      _.extend(request, { rankBy: google.maps.places.RankBy.DISTANCE });  // rank by Prominence is default, unless indicated by parameter
    } else {
      _.extend(request, { radius: '2000' });  // search radius in meters
    }

    _.each(markers, function(marker) {
      marker.setMap(null);  // reset current markers on map
    });

    markers = []; // clear markers array
    $scope.sitesResults = []; // clear site list

    var service = new google.maps.places.PlacesService($scope.map);  // init service
    service.nearbySearch(request, nearbySearchCallback);  // perform the search with given parameters

    function nearbySearchCallback(results, status) {  // this callback must handle the results object and the PlacesServiceStatus response

      if (status === google.maps.places.PlacesServiceStatus.OK) {

        //
        $scope.sitesResults = results; // populate site list with results

        $scope.$apply();  // force update the $scope
        
        _.each(results, function(place,element) {  // create markers for results
          $http.post('/siteinfo', place)  // post site info to server
            .then(function successCallback(response) {
              place.checkins = response.data.checkins;
            }, function errorCallback(response) {
              console.error('database post error: ', error);
            });
          $scope.createMarker(place,keyword,element);
        });
      }
    }
  };


// CHECKIN TO A SITE
  $scope.siteCheckin = function(site) {  // triggered by click on site checkin button
    $http.post('/checkin', site)  // makes a post request with the item that was clicked on
      .then(function successCallback(response) {
        site.checkins = response.data.checkins;
        site.checkedin = true;
      }, function errorCallback(response) {
        console.error('database post error: ', error);
      });
  };

  $scope.siteCheckout = function(site) {  // triggered by click on site checkout button
    $http.post('/checkout', site)  // makes a post request with the item that was clicked on
      .then(function successCallback(response) {
        site.checkins = response.data.checkins;
        site.checkedin = false;
      }, function errorCallback(response) {
        console.error('database post error: ', error);
      });
  };

}]);

}());
