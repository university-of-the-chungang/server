const express = require('express');
const router = express.Router();
const DB = require('../../db');


router.get('/', function (req, res, next) {
  res.render('./main/GroupPolicy/OldGroup/oldgroup');
});// 기존 그룹페이지


module.exports = router;