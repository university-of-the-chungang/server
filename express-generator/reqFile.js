const express = require('express');
const DB = require('../../db');
const jwt = require('jsonwebtoken');
let SECRET = 'token_secret';

var router = express.Router();

router.post('/', function(req, res, next) {

	console.log("post test");
  
	ip = req.ip.replace('::ffff:', '');
	console.log(ip);
	
	db.query('select FILE_NAME \
				from TBL_XCCDF \
				where XCCDF_CD in ( \
				select XCCDF_CD from TBL_XCCDF_SET_LIST \
				where GROUP_SET_CD in( \
				select GROUP_SET_CD \
				from TBL_GROUP_SET_LIST \
				where agent_cd in ( \
				select agent_cd \
				from TBL_AGENT_INFO \
				where IP=\''+ ip +'\')))'
	).then(function(recordset){
	    res.setHeader('Content-Type', 'application/json');
		res.send(recordset); 
	})
	.catch(function (err) {
		console.log(err);
	});
});
/*
router.post('/:fileId', function(req, res, next) {
  	
	file_name = req.params.fileId;

	db.query('select top(1) FILE_PATH from TBL_XCCDF where FILE_NAME = \'' + file_name +'\''
	).then(function(recordset){
	    console.log(recordset.recordset[0].FILE_PATH);
		res.sendFile(recordset.recordset[0].FILE_PATH);
	})
	.catch(function (err) {
		console.log(err);
	});	
	
});
*/
router.post('/:fileId', function(req, res, next) {
  	
	ip = req.ip.replace('::ffff:', '');
	console.log(ip);

	file_name = req.params.fileId;

	if(file_name == 'reqxccdf'){

		DB.get_xccdf(ip).then(result => {
			console.log(result.recordsets[0][0]['FILE_PATH']);
			res.sendFile(result.recordsets[0][0]['FILE_PATH']);
   		 });
	}
});

module.exports = router;
