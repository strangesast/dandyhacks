var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
  type: {
    type: String,
    default: 'mobile'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', User);
