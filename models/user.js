var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
  username: {
    type: String,
    required: true
  },
  profile: {
    type: Number,
    default: 1
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('User', User);
