const express = require('express');
const router = express.Router();
const DB = require('../../db');

router.get('/', function (req, res, next) {

  DB.total_group_info().then(result => {
    let len = result.recordset.length;
    console.log(result.recordset[0]);
    res.render('./main/GroupPolicy/group', {
      data: result.recordset,
      length: len
    });
  });

}); // 그룹페이지 홈


module.exports = router;