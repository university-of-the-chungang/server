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
  DB.login_admin(req.body['login_name'], req.body['login_pw']).then((result) => {
    if (result === 1) {
      resultData = ({
        status: 200,
        message: "Success",
        data: null
      });
    } else {
      resultData = ({
        status: 400,
        description: "로그인실패",
        message: "Login Failed"
      });
    }
    res.render('test_mssql', { view_singin: JSON.stringify(resultData) });
  }).catch(err => {
    resultData = {}
    if (String(err) === 'Please fill the blank.') {
      resultData = ({
        "status": 400,
        description: "빈칸을 모두 채우세요",
        message: err
      });
    } else {

      resultData = ({
        "status": 500,
        description: "서버에러",
        message: "Internal Server Error"
      });
    }
    res.render('test_mssql', { view_singin: JSON.stringify(resultData) });
  });
});
router.get('/test', (req, res, next) => {
  res.render('test_mssql');
});
router.get('/view_tbl_agent_info', (req, res, next) => {
  DB.get_agent_info(req.query.agent_cd).then(result => {
    res.render('test_mssql', { agent_info: JSON.stringify(result) });
  }).catch((err) => {
    res.render('test_mssql', { agent_info: JSON.stringify(err) });
  });
});
router.get('/view_tbl_group_info', (req, res, next) => {
  DB.get_group_info(req.query.group_name).then(result => {
    res.render('test_mssql', { group_info: JSON.stringify(result) });
  }).catch((err) => {
    res.render('test_mssql', { group_info: JSON.stringify(err) });
  });
});

router.get('/changeinfo', function(req, res, next) {
  res.render('changeinfo' );
});




module.exports = router;
