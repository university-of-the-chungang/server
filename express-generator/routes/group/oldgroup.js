const express = require('express');
const router = express.Router();
const DB = require('../../db');
const multer = require('multer');
const LOGS = require('../../logs');
const jwt = require('jsonwebtoken');
let xlsx = require("xlsx");
let fs = require("fs");

let SECRET = 'token_secret';

let isAuthenticatied = (token)=>{
    let result = false;
    jwt.verify(token, SECRET, function(err, decoded) {
        var dateNow = new Date();
        if (err) {
            err = {
                name: 'TokenExpiredError',
                message: 'jwt expired',
                expiredAt: dateNow.getTime()/1000
            }
        }else{
            console.log(decoded.exp );
            console.log(dateNow.getTime()/1000);
            if(decoded.exp <= dateNow.getTime()/1000){
                result =  false;
            }else{
                result =  decoded.exp;
            }
        }
    });
    return result;
};


router.post('/', function (req, res, next) {
    let path = './main/GroupPolicy/OldGroup/oldgroup';
    let is_auth = isAuthenticatied(req.session.token);

    if(is_auth){
        if(req.body.change_group_NAME.length === 0) {
            res.redirect('/group');
        }else {
            DB.get_group_info(JSON.parse(req.body.change_group_NAME)).then(result => {
                DB.view_modify_group_info(JSON.parse(req.body.change_group_NAME)).then(result2 => {
                    DB.get_agent_info().then(result3 => {
                        DB.view_modify_group_IP_info(JSON.parse(req.body.change_group_NAME)).then(result4=>{
                            DB.view_xccdf_included_group(JSON.parse(req.body.change_group_NAME)).then( result5 =>{
                                DB.view_tbl_xccdf().then(result6 =>{
                                    result.expire = is_auth;
                                    res.render(path, {
                                        name: JSON.parse(req.body.change_group_NAME),
                                        tab: req.body.tab,
                                        recordsets: result.recordset, //그룹 정보 조회 -> 그룹 수정 페이지에 디폴트 정보 띄우기
                                        recordsets2: result2.recordset, //그룹 수정 페이지 정보 조회
                                        recordsets3: result3.recordset, //모든 에이전트 정보를 참조하여
                                        recordsets4: result4.recordset, //그룹 수정 페이지 에이전트 할당을 위한 IP를 조회 함
                                        recordsets5: result5.recordset, //
                                        recordsets6: result6.recordset
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }
    }else{
        res.redirect('/login');
    }
});// 기존 그룹페이지

router.post('/change_basic_info', function(req, res, next){
    let cd = req.body.editCD;
    let name = req.body.editNAME;
    let isnull = false;

    if(isnull){

    }else{
       DB.update_group_info(cd, req.body.editNAME, req.body.editINSPECTION_START_DATE, req.body.editINSPECTION_PERIOD, req.body.editDISCRIPTION).then(re => {
           LOGS.make_log("GROUP", req.session.username, "그룹 기본정보 수정");
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
            if(flag === 0){
                let agent_cd = arr[i];
                DB.insert_group_set_list(req.body.group_set_cd, agent_cd);
                DB.get_agent_info(agent_cd).then(agent_info =>{
                    DB.view_modify_agent_os_info(req.body.group_set_cd, agent_cd).then(os_info => {
                        for(var j=0; j<os_info.recordset.length; j++){
                            if(os_info.recordset[j].OS === agent_info.recordset[0].OS){
                                if(os_info.recordset[j].XCCDF_CD !== null){
                                    DB.update_xccdf_cd(req.body.group_set_cd, agent_cd, os_info.recordset[j].XCCDF_CD);
                                    break;
                                }
                            }
                        }
                    });
                });
            }
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
            LOGS.make_log("GROUP", req.session.username, "그룹 에이전트 할당 정보 수정");
            res.render('./main/GroupPolicy/OldGroup/load', {
                name: name,
                tab: 3
            });
        });
    });
});

router.post('/apply_xccdf', function(req, res, next){
   let name =  req.body.group_name;
   let group_set_cd = req.body.group_set_cd;
   let os = req.body.apply_os;
   let xccdf_cd = req.body.xccdf_radio;

   DB.get_data_for_xccdf_apply(group_set_cd, os).then(result => {
      for(var i = 0; i<result.recordset.length; i++){
          var agent_cd = result.recordset[i].AGENT_CD;
          DB.update_xccdf_cd(group_set_cd, agent_cd, xccdf_cd);
      }
      LOGS.make_log("GROUP", req.session.username, "그룹 정책 적용 정보 수정");
      res.render('./main/GroupPolicy/OldGroup/load', {
          name: name,
          tab: 3
      });
   });
});

let upload = multer({dest:'public/uploads/'});

let read_xlsx = (file_path, group_set_cd, name) => {
    let workbook = xlsx.readFile(file_path);
    let first_sheet_name = workbook.SheetNames[0];
    let first_sheet = workbook.Sheets[first_sheet_name];
    let first_data = xlsx.utils.sheet_to_json(first_sheet);

    return new Promise((resolve, reject) => {
        DB.view_modify_group_IP_info(name).then(result => {
            //에이전트 추가
            first_data.forEach(elem => {
                console.log(elem['IP']);
                if(typeof(elem['IP']) != 'undefined'){
                    //해당 에이전트 등록되어 있는지 탐색과 동시에 등록 되어 있을 경우 AGENT_CD 값 받아옴
                    DB.find_agent(elem['IP']).then(result2 => {
                        console.log(result2);
                        if(result2.recordset.length > 0) {
                            var agent_cd = result2.recordset[0].AGENT_CD;
                            var flag = 0;
                            for(var j=0; (j<result.recordset.length); j++){
                                var com = result.recordset[j].AGENT_CD + '';

                                if(com === agent_cd){
                                    flag = 1;
                                    break;
                                }
                                if(flag === 0){
                                    DB.insert_group_set_list(group_set_cd, agent_cd);
                                    DB.get_agent_info(agent_cd).then(agent_info =>{
                                        DB.view_modify_agent_os_info(group_set_cd, agent_cd).then(os_info => {
                                            for(var j=0; j<os_info.recordset.length; j++){
                                                if(os_info.recordset[j].OS === agent_info.recordset[0].OS){
                                                    if(os_info.recordset[j].XCCDF_CD !== null){
                                                        DB.update_xccdf_cd(group_set_cd, agent_cd, os_info.recordset[j].XCCDF_CD);
                                                        break;
                                                    }
                                                }
                                            }
                                        });
                                    });
                                }
                            }
                        }else{
                            console.log("그런 거 없음!");
                        }
                    })
                }else{
                    reject(false);
                }
            });

            //에이전트 삭제
            for(var j=0; (j<result.recordset.length); j++){
                var flag = 0;
                var com = result.recordset[j].AGENT_CD + '';
                first_data.forEach(elem => {
                    //해당 에이전트 등록되어 있는지 탐색
                    DB.find_agent(elem['IP']).then(result2 => {
                        if(result2.recordset.length > 0) {
                            var agent_cd = result2.recordset[0].AGENT_CD;
                            if (com === agent_cd) {
                                flag = 1;
                            }
                        }
                    });
                });
                if(flag === 0)
                    DB.delete_agent_from_group_set_list(group_set_cd, result.recordset[j].AGENT_CD);
            }
            resolve(true);
        });
    });
};

router.post('/upload_xlsx', upload.single('xlsx_file'), (req, res, next) => {
    let name = req.body.group_name;
    let group_set_cd = req.body.group_set_cd;
    console.log("/oldgroup/upload_xlsx");
    try{
        read_xlsx(req.file.path, group_set_cd, name).then(result => {
            LOGS.make_log("GROUP", req.session.username, "그룹 에이전트 할당 정보 수정");
            res.render('./main/GroupPolicy/OldGroup/load', {
                name: name,
                tab : 2
            });
        });
    }catch(e){
        console.log(e);
        res.redirect('/group?err_msg=error');
    }
});

module.exports = router;