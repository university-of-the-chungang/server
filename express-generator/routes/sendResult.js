const express = require('express');
const router = express.Router();
const DB = require('../../db');
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
	DB.insert_servey(req.body.a0,req.body.a1,req.body.a2,req.body.a3,req.body.a4,req.body.a5,req.body.a6,req.body.a7,req.body.a8).then(result => {
		res.send(result); 
    });
	
});

module.exports = router;
