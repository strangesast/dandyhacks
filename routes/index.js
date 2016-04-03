var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var User = require('../models/user');

router.get('/', function(req, res, next) {
  res.render('index', {});
});

router.post('/account', upload.array(), function(req, res, next) {
  var user = new User(req.body);
  user.save().then(function(result) {
    return res.json(result);

  }).catch(function(err) {
    return res.json({"type" : "error", "data" : err.message});
  });
});

router.get('/game', function(req, res, next) {
  res.render('game', {});
});

module.exports = router;
