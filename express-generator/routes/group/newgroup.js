const express = require('express');
const router = express.Router();
const DB = require('../../db');

router.get('/', function (req, res, next) {
  res.render('./main/GroupPolicy/NewGroup/newgroup');
});//신규 그룹페이지


router.post('/save1', (req, res, next) => {
  res.render('./main/GroupPolicy/group');
});

router.post('/save2', (req, res, next) => {
  res.render('./main/GroupPolicy/group');
});

router.post('/save3', (req, res, next) => {
  res.render('./main/GroupPolicy/group');
});


module.exports = router;