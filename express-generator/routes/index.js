/* eslint-disable no-unused-vars */
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
  res.render('./main/etc/404' );
});

// User 기능과 관련된 페이지 시작
router.get('/login', function(req, res, next) {
  res.render('./main/User/login' );
});

router.get('/signup', function(req, res, next) {
  res.render('./main/User/signup' );
});

router.get('/forgotpassword', function(req, res, next) {
  res.render('./main/User/forgotpassword' );
});

router.get('/changeinfo', function(req, res, next) {
  res.render('./main/User/changeinfo' );
});

// User 기능과 관련된 페이지 끝
router.get('/agent', function(req, res, next) {
  res.render('./main/Agent/agent');
});// 에이전트 페이지



router.get('/log', function(req, res, next) {
  res.render('./main/Log/log' );
}); // 평가문항 및 로그 추출 페이지


// 그룹 페이지
router.get('/group', function(req, res, next) {
  res.render('./main/GroupPolicy/group' );
}); // 그룹페이지 홈

router.get('/newgroup', function(req, res, next) {
  res.render('./main/GroupPolicy/NewGroup/newgroup' );
});//신규 그룹페이지

router.get('/oldgroup', function(req, res, next) {
  res.render('./main/GroupPolicy/OldGroup/oldgroup' );
});// 기존 그룹페이지


///////////////// 테스트용 API ////////////////////
router.post('/test_signin', (req, res, next) => {
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
router.post('/test_signup', (req, res, next) => {
  let data = req.body;
  DB.add_admin(data).then(result => {
    res.render('test_mssql', { test_upsign: JSON.stringify(result) });
  }).catch(err => {
    res.render('test_mssql', { test_upsign: JSON.stringify(err) });
  });
});
router.post('/change_group_state', (req, res, next) => {
  let group_set_cd = req.body.group_set_cd;
  let state = req.body.state;
  DB.change_group_state(group_set_cd, state).then(result => {
    res.render('test_mssql', { change_group_state: JSON.stringify(result) });
  }).catch(err => {
    res.render('test_mssql', { change_group_state: JSON.stringify(err) });
  });
});
router.post('/delete_group_info', (req, res, next) => {
  let group_set_cd = req.body.group_set_cd;
  DB.delete_group_info(group_set_cd).then(result => {
    res.render('test_mssql', { delete_group_info: JSON.stringify(result) });
  }).catch(err => {
    res.render('test_mssql', { delete_group_info: JSON.stringify(err) });
  });
});
router.post('/put_xccdf', (req,res,next)=>{
  DB.put_xccdf(req.body.xccdf_cd,req.body.file_name,req.body.file_path,req.body.inspect_os).then(result=>{
    DB.view_tbl_xccdf().then(Result=>{
      res.render('test_mssql', { put_xccdf: JSON.stringify(Result.recordsets) });
    }).catch(err=>{
      res.render('test_mssql', { put_xccdf: JSON.stringify(err) });
    });
  }).catch(err=>{
    res.render('test_mssql', { put_xccdf: JSON.stringify(err) });
  });
});
router.post('/mapping_xccdf_group', (req,res,next)=>{
  DB.mapping_xccdf_group(req.body.xccdf_cd,req.body.group_set_cd).then(result=>{
    DB.view_tbl_xccdf_set_list().then(Result=>{
      res.render('test_mssql', { mapping_xccdf_group: JSON.stringify(Result.recordsets) });
    }).catch(err=>{
      res.render('test_mssql', { mapping_xccdf_group: JSON.stringify(err) });
    });
  }).catch(err=>{
    res.render('test_mssql', { mapping_xccdf_group: JSON.stringify(err) });
  });
});
router.post('/add_group_info',(req,res,next)=>{
  DB.add_group_info(req.body.name,req.body.create_time,req.body.active_time,req.body.agent_counting,req.body.inspection_period,req.body.discription)
  .then(result=>{
    DB.get_group_info().then(Result=>{
      res.render('test_mssql',{add_group_info:JSON.stringify(Result.recordsets)});
    }).catch(err=>{
      res.render('test_mssql', { add_group_info: JSON.stringify(err) });
    });
  }).catch(err=>{
    res.render('test_mssql', { add_group_info: JSON.stringify(err) });
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
router.get('/get_new_xccdf_cd',(req,res,next)=>{
  DB.get_new_xccdf_cd().then(result=>{
    res.render('test_mssql', { get_new_xccdf_cd: JSON.stringify(result) });
  }).catch(err=>{
    res.render('test_mssql', { get_new_xccdf_cd: JSON.stringify(err) });
  });
});
////////////////////////////////////////////////////////////////////

router.get('/grouppolicy', function(req, res, next) {
  res.render('grouppolicy' );
});




module.exports = router;
