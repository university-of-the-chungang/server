const express = require('express');
const router = express.Router();
const DB = require('../../db');
const LOGS = require('../../logs');
const jwt = require('jsonwebtoken');


router.post('/', function (req, res, next) {
    let path = './main/GroupPolicy/OldGroup/oldgroup';

    console.log(path);

  if(req.body.change_group_NAME.length === 0) {
    res.redirect('/group');
  }else {
      DB.get_group_info(JSON.parse(req.body.change_group_NAME)).then(result => {
          DB.view_modify_group_info(JSON.parse(req.body.change_group_NAME)).then(result2 => {
              DB.get_agent_info().then(result3 => {
                  DB.view_modify_group_IP_info(JSON.parse(req.body.change_group_NAME)).then(result4=>{
                      DB.view_xccdf_included_group(JSON.parse(req.body.change_group_NAME)).then( result5 =>{
                          res.render(path, {
                              name: JSON.parse(req.body.change_group_NAME),
                              tab: req.body.tab,
                              recordsets: result.recordset,
                              recordsets2: result2.recordset,
                              recordsets3: result3.recordset,
                              recordsets4: result4.recordset,
                              recordsets5: result5.recordset
                          });
                      });
                  });
              });
          });
      })
  }
});// 기존 그룹페이지

router.post('/change_basic_info', function(req, res, next){
    let cd = req.body.editCD;
    let name = req.body.editNAME;
    let isnull = false;

    if(isnull){

    }else{
       DB.update_group_info(cd, req.body.editNAME, req.body.editINSPECTION_START_DATE, req.body.editINSPECTION_PERIOD, req.body.editDISCRIPTION).then(re => {
           console.log(name);
           res.render('./main/GroupPolicy/OldGroup/load', {
               name: name,
               tab: 2
           });
        });
    }
});

router.post('/change_group_set_list', function(req, res, next){
    let name = req.body.group_name;
    let arr = JSON.parse(req.body.change_group_set_list);
    DB.delete_group_set_list(req.body.group_set_cd).then( result=> {
        for(var i = 0; (i < arr.length); i++) {
            DB.insert_group_set_list(req.body.group_set_cd, arr[i]);
        }
        DB.change_group_agent_counting(req.body.group_set_cd, arr.length).then(result =>{
            res.render('./main/GroupPolicy/OldGroup/load', {
                name: name,
                tab: 3
            });
        });
    });
});



/*router.post('/', function(req,res,next){
    res.render('./main/GroupPolicy/OldGroup/asdf');
});*/

module.exports = router;