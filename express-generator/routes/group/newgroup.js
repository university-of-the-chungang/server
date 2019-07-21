const express = require('express');
const router = express.Router();
const DB = require('../../db');

router.get('/', function (req, res, next) {

    DB.get_agent_info().then(result3 => {

        res.render('./main/GroupPolicy/NewGroup/newgroup', {

            recordsets3: result3.recordset
        });
    });
});//신규 그룹페이지

router.post('/', function (req, res, next) {

    console.log(req.body['os_list[]']);

    DB.get_agent_info().then(result3 => {

        res.render('./main/GroupPolicy/NewGroup/newgroup', {

            recordsets3: result3.recordset,
            os_list: req.body['os_list[]']
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
