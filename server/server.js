// Unbalanced ()) Greenfield Project
// =============================================================================

var express = require('express');        // bring in express
var bodyParser = require('body-parser');  // bring in body parser for parsing requests
var router = require('./router.js');  // add link to our router file
var session = require('express-session');  // to enable user sessions
var passport = require('passport');  // auth via passport
var FacebookStrategy = require('passport-facebook').Strategy;  // FB auth via passport
var cookieParser = require('cookie-parser');  // parses cookies
var uriUtil = require('mongodb-uri');  // util for Mongo URIs
var http = require('http');
var sockets = require('socket.io');
var Q = require('q');  // promises library


// SCHEMA / MODELS
var User = require('./models/userModel.js');
var Site = require('./models/siteModel.js');

var app = express(); 
var server = http.createServer(app)
    // define our app using express
var io = sockets(server)



var port = process.env.PORT || 8080;   // set our port

app.use(bodyParser.urlencoded({ extended: true })); // use bodyParser() for req body parsing
app.use(bodyParser.json());

// AUTH INIT
app.use(session({ secret: 'this is the greenfield' }));
app.use(passport.initialize());  // initialize passport
app.use(passport.session());  // to support persistent login sessions
app.use(cookieParser());

passport.serializeUser(function(user, done) { // serialization is necessary for persistent sessions
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// DATABASE
var mongoose = require('mongoose');     // enable Mongoose for db
var mongodbUri = 'mongodb://ec2-54-84-58-223.compute-1.amazonaws.com/test';  // our DB URI
var mongooseUri = uriUtil.formatMongoose(mongodbUri);  // formatting for Mongoose

var mongooseOptions = {  // MongoLabs-suggested socket options
  server: {
    socketOptions: {
      keepAlive: 1, connectTimeoutMS: 30000
    }
  }, 
  replset: {
    socketOptions: {
      keepAlive: 1, connectTimeoutMS : 30000
    }
  }
};

mongoose.connect(mongooseUri, mongooseOptions); // connect to our DB
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));


// ROUTING
app.use(express.static(__dirname + '../../client/app'));  // serve static files
app.use('/', router);
app.use('/logout', router);
app.use('/userinfo', router);
app.use('/siteinfo', router);
app.use('/checkin', router);
app.use('/checkout', router);
app.use('/auth/facebook',router);
app.use('callback', router);



// SERVER INIT
server.listen(port);
console.log('Unbalanced magic is happening on port ' + port);

//listen for the connection -- SOCKETS.IO magic happens here
io.on('connection', function(socket){
     console.log('why hello there, socket.io')

    var defaultSport = 'general';

    var sports = {
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

    //emit the sports array on setup of connection
    socket.emit('setup', {sports: sports});

  socket.on('new message', function(data){
    //the socket broadcast the received message,
    //for immediate display by other connected clients
    //however we must ensure that what we broadcast back
    //has the exact same format as what the database query
    //will return when it makes the db extraction
    //i.e. this immediate broadcast signal must precisely match the format 
    //we ultimately save messages into the DB
    var obj ={}
    obj.username = data.username;
    obj.messages = {};
    obj.messages.content = data.content;

    console.log('new message received', obj)
    io.sockets.emit('message created', obj)

  });

//when a user changes sport, server needs to know, this is switching channels/rooms
socket.on('switch channel',function(data){
  //handle both joining the new channel and leaving the old channel
  socket.leave(data.oldChannel);
  socket.join(data.newChannel);
  //emit a leaving signal on the old channel
  io.in(data.oldChannel).emit('user left', data);
  //emit a signal on the new channel
  io.in(data.newChannel).emit('user joined', data);



});

  //listen for a new chat message & save it to db
  socket.on('new message', function(data){
    var findUser = Q.nbind(User.findOne, User);
    //check that user exists before saving the message
    findUser({username:data.username})
      .then(function(user){
        if (!user){
          next(new Error('user does not exist'))
        } else {
          //for this username, find the correspsomding ._id & push in msg
          var update = Q.nbind(User.findByIdAndUpdate, User);

          var newMsg = {
            content: data.content,
            room: data.room.toLowerCase(),
            created: new Date()
          };
          update(user._id,
            {$push: {"messages" : newMsg}})
        }
      }).then(function(user){
        console.log('message saved :)')

      });
  });

});




<<<<<<< HEAD


=======
>>>>>>> updated schema, messages are now saved by server to db
// DB TESTING - keep this! uncomment to test if db is connected
  // var userCreate = Q.nbind(User.create, User);
  // var newUser = {
  //  'user_fb_id' : 12345,
  //  'username' : 'alex'
  // };
  // userCreate(newUser);

  // var siteCreate = Q.nbind(Site.create, Site);
  // var newSite = {
  //  'site_place_id' : 54321,
  //  'sitename' : 'JAMTOWN'
  // };
  // siteCreate(newSite);
