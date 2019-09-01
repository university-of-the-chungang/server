const express = require('express');
const router = express.Router();
const DB = require('../../db');
const jwt = require('jsonwebtoken');

router.get('/', function (req, res, next) {

    DB.get_agent_info().then(result3 => {
        DB.view_tbl_xccdf().then(result6 => {
            res.render('./main/GroupPolicy/NewGroup/newgroup', {
                recordsets3: result3.recordset,
                recordsets6: result6.recordset
            });
        })
    });
});//신규 그룹페이지

router.post('/', function (req, res, next) {

    let os_list = req.body['os_list[]'];
    let os_policy_os = req.body['os_policy[os][]'];
    let os_policy_file_name = req.body['os_policy[file_name][]'];
    let os_policy_xccdf_number = req.body['os_policy[xccdf_number][]'];

    console.log(req.body);

    if (!Array.isArray(os_list)){
        os_list = [os_list];
    }
    if (!Array.isArray(os_policy_os)){
        os_policy_os = [os_policy_os];
    }
    if (!Array.isArray(os_policy_file_name)){
        os_policy_file_name = [os_policy_file_name];
    }
    if (!Array.isArray(os_policy_xccdf_number)){
        os_policy_xccdf_number = [os_policy_xccdf_number];
    }

    let os_policy_list = [];

    for (let os of os_list) {
        os_policy = {};
        os_policy['os'] = os;
        os_policy['file_name'] = "할당 결과 없음";
        os_policy['is_allocated'] = 0;
        os_policy['xccdf_number'] = 999;

        for (let i in os_policy_os) {
            if (os_policy['os'] === os_policy_os[i]) {
                os_policy['file_name'] = os_policy_file_name[i];
                os_policy['xccdf_number'] = os_policy_xccdf_number[i];
                os_policy['is_allocated'] = 1
            }
        }

        os_policy_list.push(os_policy);
    }

    console.log(os_policy_list);

    DB.get_agent_info().then(result3 => {
        DB.view_tbl_xccdf().then(result6 => {
            console.log(result6.recordset);
            res.render('./main/GroupPolicy/NewGroup/newgroup', {
                recordsets3: result3.recordset,
                recordsets6: result6.recordset,
                os_list: os_list,
                os_policy_list: os_policy_list
            });
        });
    });
});//신규 그룹페이지

router.post('/update-home-tab', (req, res, next) => {

    DB.create_group_home(req.body.group_name, req.body.group_desc, req.body.group_date, req.body.group_period, []).then(result => {
        console.log(result);

        res.send("success");
    });

});

router.post('/update-profile-tab', (req, res, next) => {

    DB.create_group_home(req.body.group_name, req.body.group_desc, req.body.group_date, req.body.group_period, req.body.cd_list).then(result => {

        console.log(result);

        //방금 만들어진 그룹 아이디 얻기
        DB.get_group_id().then(result => {

            let group_id = result.recordset[0]['GROUP_SET_CD'];

            let group_agent_mapping = [];

            for (let agent_id of req.body.cd_list) {
                group_agent_mapping.push([group_id, agent_id]);
            }

            DB.set_group_agent_mapping(group_agent_mapping).then(result => {
                res.send("success");
            });
        });
    });

});

router.post('/update-contact-tab', async (req, res, next) => {

    DB.create_group_home(req.body.group_name, req.body.group_desc, req.body.group_date, req.body.group_period, req.body.cd_list).then(result => {

        // console.log(result);

        //방금 만들어진 그룹 아이디 얻기
        DB.get_group_id().then(result => {

            let group_id = result.recordset[0]['GROUP_SET_CD'];

            let group_agent_mapping = [];

            for (let agent_id of req.body.cd_list) {
                group_agent_mapping.push([group_id, agent_id]);
            }

            DB.set_group_agent_mapping(group_agent_mapping).then(result => {
                res.send("success");

                let os_agent_map = {};

                for (let i in req.body.os_list) {
                    if(os_agent_map[req.body.os_list[i]]) {
                        os_agent_map[req.body.os_list[i]].push(req.body.cd_list[i]);
                    } else {
                        os_agent_map[req.body.os_list[i]] = [req.body.cd_list[i]];
                    }
                }

                for (let os of Object.keys(req.body.os_policy)) {
                    console.log(os);
                    console.log(os_agent_map[os]);
                    let agent_cd = os_agent_map[os];
                    let policy_id = req.body.os_policy[os];

                    for (let cd of agent_cd) {
                        DB.set_policy(group_id, cd, policy_id).then(result => {
                           res.send("Success");
                        });
                    }
                }

                console.log(os_agent_map);

                console.log(req.body.os_policy, '시발');
                console.log(req.body.os_list);
            });
        });
    });
});

router.post('/change_group_set_list', function(req, res, next){
    let name = req.body.group_name;
    let arr = JSON.parse(req.body.change_group_set_list);
    DB.delete_group_set_list(req.body.group_set_cd).then( result=> {
        for(var i = 0; (i < arr.length); i++) {
            DB.insert_group_set_list(req.body.group_set_cd, arr[i]);
        }
        res.render('./main/GroupPolicy/OldGroup/load', {
            name: name,
            tab: 3
        });
    });
});


module.exports = router;
