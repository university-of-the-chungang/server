const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

router.get('/dashboard', function(req, res, next) {
  res.render('dashboard' );
});


router.get('/404', function(req, res, next) {
  res.render('404' );
});


router.get('/login', function(req, res, next) {
  res.render('login' );
});


router.get('/signup', function(req, res, next) {
  res.render('signup' );
});

router.get('/forgotpassword', function(req, res, next) {
  res.render('forgotpassword' );
});

router.get('/empty', function(req, res, next) {
  res.render('empty' );
});

router.get('/logmanagement', function(req, res, next) {
  res.render('logmanagement' );
});

router.get('/agentmanagement', function(req, res, next) {
  res.render('agentmanagement' );
});

router.get('/changeinfo', function(req, res, next) {
  res.render('changeinfo' );
});

router.get('/grouppolicy', function(req, res, next) {
  res.render('grouppolicy' );
});




module.exports = router;
