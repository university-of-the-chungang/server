const express = require('express');
const router = express.Router();
const DB = require('../../db');


router.post('/', function (req, res, next) {
  if(req.body.change_group_NAME.length === 0) {
    res.redirect('/group');
  }else {
    DB.get_group_info(JSON.parse(req.body.change_group_NAME)).then(result => {
      DB.view_modify_group_info(JSON.parse(req.body.change_group_NAME)).then(result2 => {
        DB.get_agent_info().then(result3 => {
            DB.view_modify_group_os_info(JSON.parse(req.body.change_group_NAME)).then(result4 => {
                console.log(result4);
                res.render('./main/GroupPolicy/OldGroup/oldgroup', {
                    recordsets: result.recordset,
                    recordsets2: result2.recordset,
                    recordsets3: result3.recordset,
                    recordsets4: result4.recordset
                });
            });
        });
      });
    })
}
});// 기존 그룹페이지

module.exports = router;