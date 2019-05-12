/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const DB = require('../db');

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

router.post('/login',(req,res,next)=>{
  DB.login_admin(req.body['login_name'],req.body['login_pw']).catch(err=>{
    res.json({result:err})
  }).then((result)=>{
    if(result === 1){
      res.json({result:"Success"});
    }else{
      res.json({result:"Fail"});
    }
  }).catch(()=>{
  });
});
router.get('/test',(req,res,next)=>{
  res.render('test_mssql');
})

module.exports = router;
