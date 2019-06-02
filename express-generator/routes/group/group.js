const express = require('express');
const router = express.Router();
const DB = require('../../db');

router.get('/', function (req, res, next) {

  DB.total_group_info().then(result => {
    console.log(result);
    res.render('./main/GroupPolicy/group');
  });

}); // 그룹페이지 홈


module.exports = router;