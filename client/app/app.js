(function() {
'use strict';

angular.module('myApp', [
  'ngRoute',
  'ngCookies',
  'myApp.home'
])

.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home', {
    templateUrl: 'home/home.html',
    controller: 'homeController'
  })
    .when('/chats', {
      templateUrl: 'chats.html',
      controller: 'homeController'
    })
    .otherwise({redirectTo: '/home'});
  
}])

.factory("userObj",function(){
  return {};
})


.controller('mainController', ['$scope', '$cookies',"userObj", function($scope, $cookies, userObj) {



// COOKIES

  $scope.fbCookie = false;
  var fbCookie = $cookies.get('facebook');  // get cookie from FB

  if (fbCookie) {
    fbCookie = fbCookie.split('j:');
    fbCookie = JSON.parse(fbCookie[1]);  // parse the cookie

    var user = {
      'fbUserId' : fbCookie.fbId,
      'fbUserName' : fbCookie.fbUserName,
      'fbPicture' : fbCookie.fbPicture
    };
    
    $scope.user = user;
    $scope.fbCookie = true;

    // $scope.userObj = userObj;
    // $scope.userObj.username = user;
    userObj.user = user.fbUserName

  }

}]);

}());