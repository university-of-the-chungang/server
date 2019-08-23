const express = require('express');
const router = express.Router();
const DB = require('../../db');
const jwt = require('jsonwebtoken');

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
}

// 그룹페이지 홈
router.get('/', function (req, res, next) {
  DB.total_group_info().then(result => {
    result.token = req.session.token;
    result.user_name = req.session.username;
    let is_auth = isAuthenticatied(req.session.token);
    if(is_auth){
      result.expire = is_auth;
      res.render('./main/GroupPolicy/group', result);
    }else{
      res.redirect('/login');
    }
    //let len = result.recordset.length;
    //console.log(result.recordset[0]);
  });
});

//그룹 정보 삭제
router.post('/del_group_info', (req,res,next) => {
  console.log(req.body.del_group_set_cd.length);
  if(req.body.del_group_set_cd.length === 0) {
    DB.get_group_info().then(result => {
      res.redirect('/group');
    })
  }else{
    DB.delete_group_info(JSON.parse(req.body.del_group_set_cd)).then(()=> {
      //console.log(req.body.del_group_set_cd);
      res.redirect('/group');
    }).catch(err=> {
      console.log(err);
    })
  }
});

router.post('/active_state', (req, res, next) => {
  console.log(req.body.cd, req.body.state);
  DB.activate_group_info(req.body.cd, req.body.state).then(() => {
    res.redirect('/group');
  });
});


//그룹 정보 상세보기
router.get('/:name', (req, res, next) =>{
  let is_auth = isAuthenticatied(req.session.token);
  if(is_auth){
    DB.get_group_info(req.params.name).then(result => {
      DB.view_modify_group_info(req.params.name).then(result2 =>{
        DB.view_xccdf_included_group(req.params.name).then(result3 =>{
          result.expire = is_auth;
          res.render('./main/GroupPolicy/GroupInfo/groupinfo', {
            recordsets: result.recordset,
            recordsets2: result2.recordset,
            recordsets3: result3.recordset
          });
        });
      });
    });
  }else{
    res.redirect('/login');
  }
});

module.exports = router;