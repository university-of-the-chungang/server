const express = require("express");
const router = express.Router();
const DB = require("../../db");
const multer = require('multer');
const jwt = require("jsonwebtoken");
const make_dashboard = require("../make_dashboard_html");
const make_group = require("../make_group_html");
const make_export = require("../make_xccdf_export_html");
const make_report = require("../make_report_html");
var fs = require("fs");

let SECRET = "token_secret";
function leadingZeros(n, digits) {
  var zero = "";
  n = n.toString();

  if (n.length < digits) {
    for (i = 0; i < digits - n.length; i++) zero += "0";
  }
  return zero + n;
}
function getTimeStamp(d) {
  console.log(d);
  var s =
    leadingZeros(d.getFullYear(), 4) +
    "-" +
    leadingZeros(d.getMonth() + 1, 2) +
    "-" +
    leadingZeros(d.getDate(), 2) +
    " " +
    leadingZeros(d.getHours(), 2) +
    ":" +
    leadingZeros(d.getMinutes(), 2) +
    ":" +
    leadingZeros(d.getSeconds(), 2);

  return s;
}
let isAuthenticatied = token => {
  let result = false;
  jwt.verify(token, SECRET, function(err, decoded) {
    var dateNow = new Date();
    if (err) {
      err = {
        name: "TokenExpiredError",
        message: "jwt expired",
        expiredAt: dateNow.getTime() / 1000
      };
    } else {
      console.log(decoded.exp);
      console.log(dateNow.getTime() / 1000);
      if (decoded.exp <= dateNow.getTime() / 1000) {
        result = false;
      } else {
        result = decoded.exp;
      }
    }
  });
  return result;
};

// 그룹페이지 홈
router.get("/", function(req, res, next) {
  DB.total_group_info().then(result => {
    if(typeof(req.query.err_msg) !== "undefined"){
      result.reason = req.query.err_msg;
    }
    result.token = req.session.token;
    result.user_name = req.session.username;
    let is_auth = isAuthenticatied(req.session.token);
    if (is_auth) {
      result.expire = is_auth;
      res.render("./main/GroupPolicy/group", result);
    } else {
      res.redirect("/login");
    }
  });
});

//그룹 정보 삭제
router.post("/del_group_info", (req, res, next) => {
  console.log(req.body.del_group_set_cd.length);
  if (req.body.del_group_set_cd.length === 0) {
    DB.get_group_info().then(result => {
      res.redirect("/group");
    });
  } else {
    DB.delete_group_info(JSON.parse(req.body.del_group_set_cd))
      .then(() => {
        //console.log(req.body.del_group_set_cd);
        res.redirect("/group");
      })
      .catch(err => {
        console.log(err);
      });
  }
});

router.post("/active_state", (req, res, next) => {
  console.log(req.body.cd, req.body.state);
  DB.activate_group_info(req.body.cd, req.body.state).then(() => {
    res.redirect("/group");
  });
});

router.get("/downloadhtml", (req, res, next) => {
  let group_cd = JSON.parse(req.query["group_cd"].split(',')[0]);
  let agent_cd = req.query['agent_cd'].split(',')[0];
  DB.get_agents_from_group_cd(group_cd,agent_cd).then(result => {
    let param = result.recordset;
    let idx = 0;
    make_group.buildHtml(param).then(result2 => {
      let filename =
        getTimeStamp(param[idx]["SUBMIT_DATE"]) +
        "_" +
        param[idx]["GROUP_SET_CD"];
      let stream = fs.createWriteStream(
        "public/uploads/" + filename.replace(/(\s|\:)/gi, "_") + ".html"
      );
      stream.on("finish", function() {
        res.download(
          "public/uploads/" + filename.replace(/(\s|\:)/gi, "_") + ".html"
        );
      });
      stream.write(result2);
      stream.end();
      // res.writeHead(200, {'Content-Type': 'text/html','Content-Length':Buffer.byteLength(result,'utf8')});
      // res.write(result);
      // res.end();
    });
  });
});

router.get('/xccdf',(req,res,next)=>{
  let query = req.query;
  let xccdf_cd = query['xccdf_cd'];
  DB.view_xccdf_items(xccdf_cd).then(result=>{
    res.json(result);
  })
});

router.get('/export',(req,res,next)=>{
  let query = req.query;
  make_export.buildHtml(query).then(result=>{
    res.writeHead(200, {'Content-Type': 'text/html','Content-Length':Buffer.byteLength(result,'utf8')});
    res.write(result);
    res.end();
  });
});

router.get('/stats', (req, res, next) => {
  let query = req.query;
  let agent_cd = query['agent_cd'];
  let group_set_cd = query['group_set_cd'];

  console.log(agent_cd, group_set_cd);

  DB.get_inspect_stats(group_set_cd, agent_cd).then(result=>{
    console.log(result);
    res.json(result);
  });
});

//그룹 정보 상세보기
router.get("/:name", (req, res, next) => {
  let is_auth = isAuthenticatied(req.session.token);
  if (is_auth) {
    DB.get_group_info(req.params.name).then(result => {
      DB.view_modify_group_info(req.params.name).then(result2 => {
        DB.view_xccdf_included_group(req.params.name).then(result3 => {
          DB.view_group_for_report(req.params.name).then(result4=>{
            result.expire = is_auth;
            //console.log(result.recordset);
            console.log(result2.recordset);
            //console.log(result3.recordset);
            console.log(result4.recordset);
            res.render("./main/GroupPolicy/GroupInfo/groupinfo", {
              recordsets: result.recordset,
              recordsets2: result2.recordset,
              recordsets3: result3.recordset,
              recordsets4: result4.recordset
            });
          });
        });
      });
    });
  } else {
    res.redirect("/login");
  }
});

router.post("/download_inspect_result", (req, res, next) => {
  let agent_cd = req.body.agent_cd;
  let group_cd = req.body.group_cd;
  let inspect_cd = req.body.inspect_cd;
  let group_name = req.body.group_name;

  console.log(agent_cd , group_cd , inspect_cd, group_name);

  DB.get_report_data(agent_cd, inspect_cd, group_cd).then(result2 => {
    let recordset = JSON.parse(JSON.stringify(result2.recordset).replace(/\\/gi, '/'));
   // console.log("recordset", recordset[0]);
    //res.redirect("/group");
    DB.get_inspect_survey(inspect_cd, agent_cd).then(result3 => {
      console.log("result3", result3.recordset);
      make_report.buildHtml(recordset[0], result3.recordset).then(result=>{
        res.writeHead(200, {'Content-Type' : 'text/html', 'Content-Length':result.length});
        res.write(result);
        res.end();
      });
    });
    //res.redirect("/group");
  });

});

let upload = multer({dest:'public/uploads_off_result/'});

const find_agent_inGroup = (ip, group_set_cd) => {
  return new Promise((resolve, reject) =>{
    let flag = 0;
    DB.get_group_agents(group_set_cd).then(result => {
      DB.find_agent(ip).then(agent_cd => {
        for(var i=0; i<result.recordset.length; i++){
          if(result.recordset[i].AGENT_CD === agent_cd.recordset[0].AGENT_CD){
            flag = 1;
            break;
          }
        }
        if(flag === 1){
          resolve(agent_cd.recordset[0].AGENT_CD);
        }else{
          reject(-111);
        }
      });
    });
  });
};

//오프라인 점검결과 업로드
router.post("/upload_offline_result", upload.single("offresultfile"), (req, res, next) => {
  try{
    var name = JSON.parse(req.body.group_NAME);
    var group_set_cd = JSON.parse(req.body.group_cd);
    var ip = req.body.agent_ip;
    var redirect_path = "/group/" + name;
    console.log(redirect_path);
    data = fs.readFileSync(req.file.path);
    line_data = data.toString().split('\r');

    find_agent_inGroup(ip, group_set_cd).then(agent_cd => {
      if(agent_cd === -111){
        console.log("error");
        res.redirect('/group?err_msg=error');
      }

      console.log(agent_cd);
      let grd = 0;

      for (var a in line_data) {
          var dd = line_data[a].split(' ');
          if (dd[2] === 1)
              grd++;
      }

      DB.report_inspect_stats(group_set_cd, grd, agent_cd, line_data.length);
      DB.get_inspect_cd().then(result => {
          let inspect_cd = result.recordset[0].max_INSPECT_CD;
          for (var a in line_data) {
              var dd = line_data[a].split(' ');
              DB.insert_result(inspect_cd, dd[0], dd[2], agent_cd);
          }
          res.redirect(redirect_path);
      });
    });
  }catch (e) {
    console.log(e);
    res.redirect('/group?err_msg=error');
  }

});

module.exports = router;
