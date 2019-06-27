const express = require('express');
const router = express.Router();
const DB = require('../../db');


router.post('/', function (req, res, next) {
  if(req.body.change_group_NAME.length === 0) {
    res.redirect('/group');
  }else{
    console.log(req.body.change_group_NAME);
    DB.get_group_info(JSON.parse(req.body.change_group_NAME)).then(result => {
      console.log(result);
      res.render('./main/GroupPolicy/OldGroup/oldgroup', result);
    })
  }
});// 기존 그룹페이지

module.exports = router;