/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const DB = require('../db');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

router.get('/dashboard', function (req, res, next) {
  res.render('dashboard');
});


router.get('/404', function (req, res, next) {
  res.render('404');
});


router.get('/login', function (req, res, next) {
  res.render('login');
});


router.get('/signup', function (req, res, next) {
  res.render('signup');
});

router.get('/forgotpassword', function (req, res, next) {
  res.render('forgotpassword');
});

router.get('/empty', function (req, res, next) {
  res.render('empty');
});

router.get('/logmanagement', function (req, res, next) {
  res.render('logmanagement');
});

router.get('/agentmanagement', function (req, res, next) {
  res.render('agentmanagement');
});

router.post('/signin', (req, res, next) => {
  DB.login_admin(req.body['login_name'], req.body['login_pw']).catch(err => {
    if (String(err) === 'Please fill the blank.') {
      res.json({
        "status": 400,
        code: "4005",
        description: "빈칸을 모두 채우세요",
        message: err
      });
    } else {

      res.json({
        "status": 500,
        code: "5000",
        description: "서버에러",
        message: "Internal Server Error"
      });
    }
  }).then((result) => {
    if (result === 1) {
      res.json({
        status: 200,
        code: 200
        , message: "Success",
        data: null
      });
    } else {
      res.json({
        status: 400,
        code: 4006,
        description: "로그인실패",
        message: "Login Failed"
      });
    }
  }).catch(() => {
  });
});
router.get('/test', (req, res, next) => {
  res.render('test_mssql');
});
router.get('/view_tbl_agent_info',(req,res,next)=>{
  DB.get_agent_info(req.query.agent_cd).then(result=>{
    res.render('test_mssql',{agent_info : JSON.stringify(result)});
  }).catch((err)=>{
    res.render('test_mssql',{agent_info : JSON.stringify(err)});
  });

});
router.get('/view_tbl_group_info',(req,res,next)=>{
  DB.get_group_info(req.query.group_name).then(result=>{
    res.render('test_mssql',{group_info : JSON.stringify(result)});
  }).catch((err)=>{
    res.render('test_mssql',{group_info : JSON.stringify(err)});
  });
});

module.exports = router;
