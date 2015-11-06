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
    $scope.room = "hello";
    $scope.username = "sonny"

 //server opens connection, when client connects, setup event is called, load rooms   
socket.on('setup', function (data) {
        var rooms = data.rooms;;
        console.log('hello',rooms);
        $scope.rooms = rooms;

    })
//when we receive a message created signal from server
socket.on('message created', function (data){

	$scope.messages.push(data)
		console.log('sent back',$scope.messages )
});

//function to call when enter key hit, it emits a signal back to the server
$scope.send = function(msg){
	socket.emit('new message',{
		room: $scope.room,
		message: msg,
		username: $scope.username
	});
}

//a custom directive to trigger a function (send) when enter key is pressed
app.directive('ngEnter',function(){
	return function (scope,element,attributes){
		//bind to the keydown & key press events of the element
		element.bind("keydown keypress", function(event){
			if (event.which === 13){
				//when event is received, evaluate the function with with the directive is assocated with
				scope.$apply(function(){
					scope.$eval(attributes.ngEnter)
				});

				event.preventDefault();
			}
		})
	}
});



});