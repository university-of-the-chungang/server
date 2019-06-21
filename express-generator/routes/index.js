/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const DB = require('../db');
const LOGS = require('../logs');
const multer = require('multer');
/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});
router.get('/dashboard', function (req, res, next) {
  res.render('dashboard');
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
      LOGS.make_log("USER",req.session.username,"로그인");
      res.render('./dashboard');
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

router.get('/policy', function (req, res, next) {
  res.render('./policy');
});

// User 기능과 관련된 페이지 끝
router.get('/agent', function (req, res, next) {
  console.log(req.session.username);
  if(req.session.username){
  DB.get_agent_info().then(result => {
    result.sess_name = req.session.username;
    res.render('./main/Agent/agent', result);
  });
}else{
  res.render('./main/User/login');
}
});// 에이전트 페이지
router.get('/agent/:keyword', (req, res, next) => {
  DB.search_agent_info(req.params.keyword).then(result => {
    result.sess_name = req.session.username;
    res.render('./main/Agent/agent', result);
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
router.get('/log', function (req, res, next) {
  res.render('./main/Log/log');
}); // 평가문항 및 로그 추출 페이지
router.post('/make_xlsx',function(req,res,next){
  let param = req.body;
  let now = new Date().toISOString().slice(0,10); 
  let result = LOGS.make_xlsx(now+".log",param);
  res.json(result);
});
let upload = multer({dest:'public/uploads/'})
router.post('/agent/upload_xlsx',upload.single('xlsx_file'),(req,res,next)=>{
  LOGS.read_xlsx(req.file.path).then(result=>{
    
    DB.get_agent_info().then(result2 => {
      LOGS.make_log("AGENT",req.session.username,"엑셀등록");
      result2.sess_name = req.session.username;
      res.render('./main/Agent/agent', result2);
    });
  }).catch(err=>{
    console.log(err);
  });
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




module.exports = router;
