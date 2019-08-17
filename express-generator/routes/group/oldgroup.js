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
                              recordsets: result.recordset, //그룹 정보 조회 -> 그룹 수정 페이지에 디폴트 정보 띄우기
                              recordsets2: result2.recordset, //그룹 수정 페이지 정보 조회
                              recordsets3: result3.recordset, //모든 에이전트 정보를 참조하여
                              recordsets4: result4.recordset, //그룹 수정 페이지 에이전트 할당을 위한 IP를 조회 함
                              recordsets5: result5.recordset //*****수정 필요
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
    DB.view_modify_group_IP_info(name).then(result => {
        //에이전트 추가
        for(var i = 0; (i < arr.length); i++) {
            var flag = 0;
            for(var j=0; (j<result.recordset.length); j++){
                var com = result.recordset[j].AGENT_CD + '';

                if(com === arr[i]){
                    flag = 1;
                    break;
                }
            }

            if(flag === 0)
                DB.insert_group_set_list(req.body.group_set_cd, arr[i]);
        }

        //에이전트 삭제
        for(var j=0; (j<result.recordset.length); j++){
            var flag = 0;
            var com = result.recordset[j].AGENT_CD + '';
            for(var i=0; (i <arr.length); i++){
                if(com === arr[i]){
                    flag = 1;
                    break;
                }
            }

            if(flag === 0)
                DB.delete_agent_from_group_set_list(req.body.group_set_cd, result.recordset[j].AGENT_CD);
        }

        //그룹 정보에 변동 사항 반영
        DB.change_group_agent_counting(req.body.group_set_cd, arr.length).then(result =>{
            res.render('./main/GroupPolicy/OldGroup/load', {
                name: name,
                tab: 3
            });
        });
    });

    /*DB.delete_group_set_list(req.body.group_set_cd).then( result=> {
        for(var i = 0; (i < arr.length); i++) {
            DB.insert_group_set_list(req.body.group_set_cd, arr[i]);
        }
        DB.change_group_agent_counting(req.body.group_set_cd, arr.length).then(result =>{
            res.render('./main/GroupPolicy/OldGroup/load', {
                name: name,
                tab: 3
            });
        });
    });*/
});



/*router.post('/', function(req,res,next){
    res.render('./main/GroupPolicy/OldGroup/asdf');
});*/

module.exports = router;