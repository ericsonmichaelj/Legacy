// Unbalanced ()) Greenfield Project
// =============================================================================

var express = require('express');        // bring in express
var bodyParser = require('body-parser'); // bring in body parser for parsing requests
var utils = require('./config/utils.js');  // bring in our utilities file
var passport = require('passport');  // auth via passport
var FacebookStrategy = require('passport-facebook').Strategy;  // FB auth via passport
var session = require('express-session');  // to enable user sessions
var User = require('./models/userModel.js');  // our user schema
var Site = require('./models/siteModel.js');  // our site schema
var router = express.Router();           // create our Express router
var cookieParser = require('cookie-parser');
var nodemailer = require("nodemailer");

// SITES
router.post('/siteinfo', utils.postSiteInfo);

router.post('/checkin', utils.siteCheckin);

router.post('/checkout', utils.siteCheckout);

//NODE-MAILER
var smtpTransport = nodemailer.createTransport("SMTP", {
  service: "Gmail",
  auth: {
    user: "gaamemailer@gmail.com",
    pass: "gaame123"
  }
});

router.post('/send', function(req, res) {
  console.log(req.body);
  var mailOptions = {
    to: req.body.to,
    subject: req.body.subject,
    html: req.body.message
  }
  console.log(mailOptions);
  smtpTransport.sendMail(mailOptions, function(error, response) {
    if (error) {
      console.log(error);
      res.end("error");
    } else {
      console.log("Message sent: " + response.message);
      res.end("sent");
    }
  });
});
router.get('/msg', utils.getMsgs);




// AUTH
router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    utils.fetchUserInfoFromFB(req, res);
  });

router.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res) {
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
  });

router.get('/userauth', passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
   res.redirect('/');
 });

passport.use( new FacebookStrategy({  // request fields from facebook
  profileFields: ['id', 'displayName', 'photos'],
  clientID: '1511033495856329',
  clientSecret: '1cc7a259818771828b4ecacdd766235a',
  callbackURL: '/auth/facebook/callback',
  enableProof: false
  },

  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
      return done(null, profile);
    });
  }
));

router.get('/logout', function(req, res) {
  req.session.destroy(function (err) {
    res.clearCookie('facebook');
    res.redirect('/');
  });
});


module.exports = router;  // export router for other modules to use
