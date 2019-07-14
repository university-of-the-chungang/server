/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const DB = require('../db');
const make_dashboard = require('./make_dashboard_html');
const LOGS = require('../logs');
const multer = require('multer');
const archiver = require('archiver');
const jwt = require('jsonwebtoken');
var util = require('util');
var path = require('path');
var mime = require('mime');
var fs = require('fs')
var async = require('async');

let SECRET = 'token_secret';

let signToken=(id)=>{
  console.log(`signTOken(${id})`);
  let token =  jwt.sign({id:id},
    SECRET,
    {expiresIn:"30m"});
    console.log(token);
    return token;
}

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
/* GET home page. */
router.get('/', (req, res, next) => {
  // res.render('index', { title: 'Express' });
  res.redirect('/dashboard');
});

router.get('/policy', (req, res, next) => {
  res.render('policy');
});



router.get('/dashboard', function (req, res, next) {
  if(req.session.username){
  DB.get_dashboard_datas().then(result => {
    DB.get_dashboard_top10().then(result2=>{
      result.sess_name = req.session.username;
      result.top10 = result2.recordsets[0];
      result.token = req.session.token;
      let is_auth = isAuthenticatied(req.session.token)
      if(is_auth){
        result.expire = is_auth;
        DB.view_admin('DIVISION, POSITION'," WHERE NAME = '"+result.sess_name+"'").then((result2)=>{
          result.division = result2.recordsets[0][0]['DIVISION'];
          result.position = result2.recordsets[0][0]['POSITION'];
          res.render('dashboard',result);
        });
      }else{
        res.redirect('/login');
      }
    })
    
  });
}else{
  res.render('./main/User/login',{referer:'dashboard'});
}
});


function downfile(res,a)
{
  console.log("downfile");
  return new Promise((resolve,reject)=>{
    var fileId = 1;
    var origFileNm, savedFileNm,savedPath,fileSize;


    origFileNm = 'log_output.txt';
    savedFileNm = "log.txt"
    savedPath = __dirname+'/log/'
    fileSize = '1000';
    
    
    var file = savedPath + '/'+savedFileNm;
    mimetype = mime.lookup(origFileNm);
    res.setHeader('Content-disposition','attachment; filename='+origFileNm);
    res.setHeader('Content-type',mimetype);

    
    var filestream = fs.createReadStream(file);
    filestream.pipe(res);

    if(a==1){
      resolve(1);  
    }
    else{
      reject(0);
    }
  });

  
}

function makelog(log_list,a)
{
  
   return new Promise((resolve,reject)=>{
    var data = "DATE\t\t\t\t\t\t\t\t\t\t\t\tID\t\tTYPE\t\tCONTENTS\n";
    console.log(log_list);
    for(var i =0 ; i < log_list.length-1; i+=4)
    {
      data += log_list[i]+"\t\t"+log_list[i+1]+"\t\t"+log_list[i+2]+"\t\t"+log_list[i+3]+"\n";  
    }
   fs.writeFileSync(__dirname+'/log/log.txt',data,'utf8');
   console.log("file make fin");
   resolve(true);
   

  });

}

function downlog(log_list,res){
  console.log(log_list);
  makelog(log_list,1)
    .then(result =>{downfile(res,1)});

}
router.post('/download/', function(req, res){
  log_list = Object.values(req.body);
  downlog(log_list,res);

});

router.get('/404', function (req, res, next) {
  res.render('./main/etc/404');
});

// User 기능과 관련된 페이지 시작
router.get('/login', function (req, res, next) {
  res.render('./main/User/login');
});
router.post('/signin',(req,res,next)=>{
  data =req.body;
  DB.login_admin(data.name,data.pass).then(result=>{
    if(result === 1){
      req.session.username = data.name;
      let token = signToken(data.name);
      req.session.token = token;
      LOGS.make_log("USER",req.session.username,"로그인");
      if(data.referer)
        res.redirect('/'+data.referer);
        // res.render(data.referer,{sess_name:data.name});
      else
      res.redirect('/dashboard');
    }else{
      req.session.username = null;
      res.render('./main/User/login');
    }
  }).catch(err=>{
    req.session.username = null;
    res.render('./main/User/login');
  });
});

router.get('/signup', function (req, res, next) {
  res.render('./main/User/signup');
});



router.post('/signup',(req,res,next)=>{
  data = req.body;
  data.lock_stat = 0;
  data.lock_count = 0;

  DB.add_admin(data).then(result=>{
    res.render('./main/User/login');
  });
});
router.get('/logout',(req,res,next)=>{
  LOGS.make_log("USER",req.session.username,"로그아웃");
  req.session.username = null;
  res.render('./main/User/login');
});

router.get('/forgotpassword', function (req, res, next) {
  res.render('./main/User/forgotpassword');
});

router.get('/changeinfo', function (req, res, next) {
  res.render('./main/User/changeinfo');
});

// User 기능과 관련된 페이지 끝
router.get('/agent', function (req, res, next) {
  let body = req.query; 
  DB.get_agent_info().then(result => {
    if (typeof(body.err_msg) !="undefined"){
      result.reason = body.err_msg;
    }
    result.token = req.session.token;
    result.user_name = req.session.username;
    let is_auth = isAuthenticatied(req.session.token);
    if(is_auth){
      result.expire = is_auth;
      res.render('./main/Agent/agent', result);
    }else{
      res.redirect('/login');
    }
  });

});// 에이전트 페이지
router.get('/agent/:keyword', (req, res, next) => {
  DB.search_agent_info(req.params.keyword).then(result => {
    result.sess_name = req.session.username;
    res.render('./main/Agent/agent', result);
  }).catch(err => {
    console.log(err);
  });

})

router.get('/log', function (req, res, next) {
  DB.get_log_info().then(result => {
    DB.total_group_info().then(result2 => {
      res.render('./main/Log/log', {
        recordsets: result.recordsets,
        data: result2.recordsets
      });
    });    
    //res.render('./main/Log/log', result);
  });
}); // 평가문항 및 로그 추출 페이지

router.get('/log/:keyword2', (req, res, next) => {
  DB.search_log_info(req.params.keyword2).then(result => {
    result.sess_name = req.session.username;
    DB.total_group_info().then(result2 => {
      res.render('./main/Log/log', {
        recordsets: result.recordsets,
        data: result2.recordsets
      });
    });    
  }).catch(err => {
    console.log(err);
  });
})

router.get('/log_date/:keyword2', (req, res, next) => {
  DB.search_logDate_info(req.params.keyword2).then(result => {
    result.sess_name = req.session.username;
    DB.total_group_info().then(result2 => {
      res.render('./main/Log/log', {
        recordsets: result.recordsets,
        data: result2.recordsets
      });
    });    
  }).catch(err => {
    console.log(err);
  });

})


router.post('/agent/del_agent_info', (req, res, next) => {
  if (req.body.del_agent_cd.length === 0) {
    DB.get_agent_info().then(result => {
      result.sess_name = req.session.username;
      res.render('./main/Agent/agent', result);
    });
  } else {
    DB.delete_agent_info(JSON.parse(req.body.del_agent_cd)).then(() => {
      LOGS.make_log("AGENT",req.session.username,"삭제");
      DB.get_agent_info().then(result => {
        result.sess_name = req.session.username;
        res.render('./main/Agent/agent', result);
      });

    }).catch(err => {
      console.log(err);
    });
  }
});

router.post('/add_manual_agent', (req, res, next) => {
  let arr = [req.body.txtIP, req.body.txtMac, req.body.txtOS, req.body.txtUseful, req.body.txtOwner, req.body.txtDesc, req.body.state];


  let isnull = false;
  arr.forEach(element => {
    if (element.length === 0) {
      isnull = true;
    }
  });
  if (isnull) {
    DB.get_agent_info().then(result => {
      result['reason'] = 'error';
      result.sess_name = req.session.username;
      res.render('./main/Agent/agent', result);
    });
  } else {
    DB.add_agent_info(req.body.txtIP, req.body.txtMac, req.body.txtOS, req.body.txtUseful, req.body.txtOwner, req.body.txtDesc, req.body.state).then(result => {
      
      LOGS.make_log("AGENT",req.session.username,"에이전트 등록");
      DB.get_agent_info().then(result2 => {
        result2.sess_name = req.session.username;
        res.render('./main/Agent/agent', result2);
      });
    });
  }
});
router.post('/update_agent_info', (req, res, next) => {
  let arr = [req.body.txtIP, req.body.txtMac, req.body.txtOS, req.body.txtUseful, req.body.txtOwner, req.body.txtDesc, req.body.state];
  let cd = req.body.cd;
  let isnull = false;
  if (req.body.txtIP.length === 0 || req.body.txtOwner.length === 0 || req.body.txtUseful.length === 0){
    isnull = true;
  }
  
  if (isnull) {
    DB.get_agent_info().then(result => {
      result['reason'] = 'error';
      result.sess_name = req.session.username;
      res.render('./main/Agent/agent', result);
    });
  } else {
    DB.update_agent_info(cd, req.body.txtIP, req.body.txtMac, req.body.txtOS, req.body.txtUseful, req.body.txtOwner, req.body.txtDesc, req.body.state).then(result => {
      
      LOGS.make_log("AGENT",req.session.username,"정보수정");
      DB.get_agent_info().then(result2 => {
        result2.sess_name = req.session.username;
        res.render('./main/Agent/agent', result2);
      });
    });
  }
});
router.post('/activate_agent_info', (req, res, next) => {
  DB.activate_agent_info(req.body.agent_cd).then(result => {
    LOGS.make_log("AGENT",req.session.username,"등록");
    DB.get_agent_info().then(result2 => {
      result2.sess_name = req.session.username;
      res.render('./main/Agent/agent', result2);
    });
  });
});


router.post('/make_xlsx',function(req,res,next){
  let param = req.body;
  let now = new Date().toISOString().slice(0,10); 
  let result = LOGS.make_xlsx(now+".log",param);
  res.json(result);
});
let upload = multer({dest:'public/uploads/'})
router.post('/agent/upload_xlsx',upload.single('xlsx_file'),(req,res,next)=>{
  try{
  LOGS.read_xlsx(req.file.path).then(result=>{
    LOGS.make_log("AGENT",req.session.username,"엑셀등록");
    res.redirect('/agent');
  }).catch(err=>{
    console.log(err);
    
    res.redirect('/agent?err_msg=엑셀 파일이 올바르지 않습니다.');
  });
}catch(e){
  console.log(e);
  res.redirect('/agent?err_msg=error');
}
});
router.post('/agent/refresh_xlsx',upload.single('xlsx_file'),(req,res,next)=>{
  LOGS.refresh_xlsx(req.file.path).then(result=>{
    DB.get_agent_info().then(result2 => {
      LOGS.make_log("AGENT",req.session.username,"등록정보갱신");
      result2.sess_name = req.session.username;
      res.render('./main/Agent/agent', result2);
    });
    })
  
});


// 그룹 페이지
const group = require('./group/group');
const oldgroup = require('./group/oldgroup');
const newgroup = require('./group/newgroup');

router.use('/group', group);
router.use('/oldgroup', oldgroup);
router.use('/newgroup', newgroup);

// 정책
const oval = require('./policy/oval');
const uploads = require('./')

router.use('/oval', oval);


///////////////// 테스트용 API ////////////////////
router.get('/test_test',(req,res,next)=>{
  let obj = [
    {
    이름 : '김선광',
    학년 : '1학년'
    },{
      이름 : '홍길동',
      학년 : '2학년'
    }
  ]
  LOGS.make_xlsx("test_test",obj);
  res.redirect('dashboard');
});

router.post('/test_signin', (req, res, next) => {
  DB.login_admin(req.body['login_name'], req.body['login_pw']).then((result) => {
    if (result === 1) {
      resultData = ({
        status: 200,
        message: "Success",
        data: null
      });
    } else {
      resultData = ({
        status: 400,
        description: "로그인실패",
        message: "Login Failed"
      });
    }
    res.render('test_mssql', { view_singin: JSON.stringify(resultData) });
  }).catch(err => {
    resultData = {}
    if (String(err) === 'Please fill the blank.') {
      resultData = ({
        "status": 400,
        description: "빈칸을 모두 채우세요",
        message: err
      });
    } else {

      resultData = ({
        "status": 500,
        description: "서버에러",
        message: "Internal Server Error"
      });
    }
    res.render('test_mssql', { view_singin: JSON.stringify(resultData) });
  });
});
router.post('/test_signup', (req, res, next) => {
  let data = req.body;
  DB.add_admin(data).then(result => {
    res.render('test_mssql', { test_upsign: JSON.stringify(result) });
  }).catch(err => {
    res.render('test_mssql', { test_upsign: JSON.stringify(err) });
  });
});
router.post('/change_group_state', (req, res, next) => {
  let group_set_cd = req.body.group_set_cd;
  let state = req.body.state;
  DB.change_group_state(group_set_cd, state).then(result => {
    res.render('test_mssql', { change_group_state: JSON.stringify(result) });
  }).catch(err => {
    res.render('test_mssql', { change_group_state: JSON.stringify(err) });
  });
});
router.post('/delete_group_info', (req, res, next) => {
  let group_set_cd = req.body.group_set_cd;
  DB.delete_group_info(group_set_cd).then(result => {
    res.render('test_mssql', { delete_group_info: JSON.stringify(result) });
  }).catch(err => {
    res.render('test_mssql', { delete_group_info: JSON.stringify(err) });
  });
});
router.post('/put_xccdf', (req, res, next) => {
  DB.put_xccdf(req.body.xccdf_cd, req.body.file_name, req.body.file_path, req.body.inspect_os).then(result => {
    DB.view_tbl_xccdf().then(Result => {
      res.render('test_mssql', { put_xccdf: JSON.stringify(Result.recordsets) });
    }).catch(err => {
      res.render('test_mssql', { put_xccdf: JSON.stringify(err) });
    });
  }).catch(err => {
    res.render('test_mssql', { put_xccdf: JSON.stringify(err) });
  });
});
router.post('/mapping_xccdf_group', (req, res, next) => {
  DB.mapping_xccdf_group(req.body.xccdf_cd, req.body.group_set_cd).then(result => {
    DB.view_tbl_xccdf_set_list().then(Result => {
      res.render('test_mssql', { mapping_xccdf_group: JSON.stringify(Result.recordsets) });
    }).catch(err => {
      res.render('test_mssql', { mapping_xccdf_group: JSON.stringify(err) });
    });
  }).catch(err => {
    res.render('test_mssql', { mapping_xccdf_group: JSON.stringify(err) });
  });
});
router.post('/add_group_info', (req, res, next) => {
  DB.add_group_info(req.body.name, req.body.create_time, req.body.active_time, req.body.agent_counting, req.body.inspection_period, req.body.description)
    .then(result => {
      DB.get_group_info().then(Result => {
        res.render('test_mssql', { add_group_info: JSON.stringify(Result.recordsets) });
      }).catch(err => {
        res.render('test_mssql', { add_group_info: JSON.stringify(err) });
      });
    }).catch(err => {
      res.render('test_mssql', { add_group_info: JSON.stringify(err) });
    });
});

router.get('/test', (req, res, next) => {
  res.render('test_mssql');
});
router.get('/view_tbl_agent_info', (req, res, next) => {
  DB.get_agent_info(req.query.agent_cd).then(result => {
    res.render('test_mssql', { agent_info: JSON.stringify(result) });
  }).catch((err) => {
    res.render('test_mssql', { agent_info: JSON.stringify(err) });
  });
});
router.get('/view_tbl_group_info', (req, res, next) => {
  DB.get_group_info(req.query.group_name).then(result => {
    res.render('test_mssql', { group_info: JSON.stringify(result) });
  }).catch((err) => {
    res.render('test_mssql', { group_info: JSON.stringify(err) });
  });
});
router.get('/get_new_xccdf_cd', (req, res, next) => {
  DB.get_new_xccdf_cd().then(result => {
    res.render('test_mssql', { get_new_xccdf_cd: JSON.stringify(result) });
  }).catch(err => {
    res.render('test_mssql', { get_new_xccdf_cd: JSON.stringify(err) });
  });
});
////////////////////////////////////////////////////////////////////

router.get('/grouppolicy', function (req, res, next) {
  res.render('grouppolicy');
});

router.post("/dashboard/download",(req,res,next)=>{
  let param = JSON.parse(req.body['row_arr']);
  // console.log(param);
  DB.get_dashboard_datas().then(result=>{
    let paths = [];
      make_dashboard.make_html(param).then(filepath=>{
        console.log(filepath);
        if(filepath.length > 1){
          let output = fs.createWriteStream(__dirname +'/result.zip');
          let archive = archiver('zip');
          output.on('end', function() {
            console.log('Data has been drained');
          });
          output.on('close', function() {
            console.log(archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
            res.download(output.path);
          });
          archive.pipe(output);
          for (let i = 0 ; i < filepath.length ; i +=1){
            archive.file(filepath[i],{name:filepath[i].split('/')[filepath[i].split('/').length-1]});
          }
          archive.finalize();
          console.log(output.path);

        }else if(filepath.length ==1){
          res.download(filepath[0]);
        }
      });
    
    
    // res.redirect('/dashboard');
  });

});


module.exports = router;
