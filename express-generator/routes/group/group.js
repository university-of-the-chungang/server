const express = require('express');
const router = express.Router();
const DB = require('../../db');

router.get('/', function (req, res, next) {
  DB.total_group_info().then(result => {
    //let len = result.recordset.length;
    //console.log(result.recordset[0]);
    res.render('./main/GroupPolicy/group', result);
  });

}); // 그룹페이지 홈

router.post('/del_group_info', (req,res,next) => {
  console.log(req.body.del_group_set_cd.length);
  if(req.body.del_group_set_cd.length === 0) {
    DB.get_group_info().then(result => {
      res.redirect('/group');
    })
  }else{
    DB.delete_group_info(JSON.parse(req.body.del_group_set_cd)).then(()=> {
      //console.log(req.body.del_group_set_cd);
      res.redirect('/group');
    }).catch(err=> {
      console.log(err);
    })
  }
});


module.exports = router;