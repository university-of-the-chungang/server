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
