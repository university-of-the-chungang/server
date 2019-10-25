const express = require('express');
const router = express.Router();
const DB = require('../db');
const jwt = require('jsonwebtoken');


router.post('/', function(req, res, next) {
	/*
	console.log(req.body.a0);
	console.log(req.body.a1);
	console.log(req.body.a2);
	console.log(req.body.a3);
	*/
	console.log('sendTest');
	//console.log(req.body.key);

	//console.log('insert TBL_INSPECT_SURVEY (INSPECT_ITEM_CD, INSPECT_RESULT) values(\'1\', \''+ req.body.a0 + '\'),(\'2\',\''+ req.body.a1 + '\'),(\'3\',\''+ req.body.a2 + '\'),(\'4\',\''+ req.body.a3 + '\')');
/*
	db.query('insert TBL_INSPECT_SURVEY (INSPECT_ITEM_CD, INSPECT_RESULT) values(\'1\', \''+ req.body.a0 + '\'),(\'2\',\''+ req.body.a1 + '\'),(\'3\',\''+ req.body.a2 + '\'),(\'4\',\''+ req.body.a3 + '\')').then(function(recordset){
		res.send(recordset); 
	})
	.catch(function (err) {
		console.log(err);
		res.send('error');
	});
*/

	const find_group_set_cd = () =>{
		return new Promise((resolve, reject) =>{
			DB.find_active_group().then(result =>{
				if(result.length === 0){
					reject(-111);
				} else{
					resolve(result.recordset[0].GROUP_SET_CD);
				}
			});
		});
	};

	find_group_set_cd().then(group_set_cd => {
		if(group_set_cd === -111){
			console.log("error");
			res.send("error");
		}
		let grd = 0;
		let dummy_list = [req.body.a0, req.body.a1, req.body.a2, req.body.a3, req.body.a4, req.body.a5, req.body.a6, req.body.a7, req.body.a8];

		for (var a in dummy_list)
		{
			if(a === 1)
				grd ++;
		}

		DB.report_inspect_stats(group_set_cd, grd,10056, 9);
		DB.get_inspect_cd().then(result => {
			let inspect_cd = result.recordset[0].max_INSPECT_CD;

			DB.insert_survey(inspect_cd, 10056,req.body.a0,req.body.a1,req.body.a2,req.body.a3,req.body.a4,req.body.a5,req.body.a6,req.body.a7,req.body.a8).then(result => {
				console.log("10056에 대한 검사결과");
				console.log("1 : " + req.body.a0);
				console.log("2 : " + req.body.a1);
				console.log("3 : " + req.body.a2);
				console.log("4 : " + req.body.a3);
				console.log("5 : " + req.body.a4);
				console.log("6 : " + req.body.a5);
				console.log("7 : " + req.body.a6);
				console.log("8 : " + req.body.a7);
				console.log("9 : " + req.body.a8);
				console.log("데이터베이스에 입력되었습니다.");
				res.send(result);
			});
		});
	});
});

module.exports = router;
