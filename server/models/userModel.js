var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');  // add findOrCreate functionality to Mongoose

//the chat schema will be nested inside the userSchema
var chatSchema = new mongoose.Schema({
  created: {type: Date},
  content: {type: String},
  username: {type: String},
  room: {type: String}
});

var userSchema = new mongoose.Schema({
  user_fb_id: {
    type: String,
    required: true
  },

  username: {
    type: String,
    required: true
  },

  photo: {
    type: String,
    required: false
  },

  checkins: {
    type: Array,
    required: false
  },
  //chat schema is nested
  messages: [chatSchema]

});



userSchema.plugin(findOrCreate);

module.exports = mongoose.model('users', userSchema);
