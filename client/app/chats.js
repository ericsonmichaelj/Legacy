'use strict';

var app = angular.module('chat', ['ngMaterial', 'ngAnimate', 'ngMdIcons', 'btford.socket-io'])
var serverBaseUrl = 'http://localhost:8080';
app.factory('socket', function (socketFactory) {
    var myIoSocket = io.connect(serverBaseUrl);

    var socket = socketFactory({
        ioSocket: myIoSocket
    });

    return socket;
});

app.controller('MainCtrl', function ($scope, $mdDialog, socket, $http) {
    $scope.messages = [];
    $scope.room = "default";
    $scope.username = "sonny"

    

 //server opens connection, when client connects, setup event is called, load rooms   
socket.on('setup', function (data) {
        var rooms = data.rooms;
        
        $scope.rooms = rooms;
 

    })
//when we receive a message created signal from server
socket.on('message created', function (data){
	$scope.messages.unshift(data)
});

//function to call when enter key hit, it emits a signal back to the server
$scope.send = function(msg){
	socket.emit('new message',{
		room: $scope.room,
		message: msg,
		username: $scope.username
	});

	$scope.message= ""
}

//a custom directive to trigger a function (send) when enter key is pressed
app.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});





});