const express = require('express');
const router = express.Router();

/* GET home page. */

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




module.exports = router;
