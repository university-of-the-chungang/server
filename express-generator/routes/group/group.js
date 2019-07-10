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

router.get('/:name', (req, res, next) =>{
  DB.get_group_info(req.params.name).then(result => {
    DB.view_modify_group_info(req.params.name).then(result2 =>{
      DB.view_xccdf_included_group(req.params.name).then(result3 =>{
        res.render('./main/GroupPolicy/GroupInfo/groupinfo', {
          recordsets: result.recordset,
          recordsets2: result2.recordset,
          recordsets3: result3.recordset
        });
      });
    });
  });
});

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