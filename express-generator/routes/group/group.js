const express = require("express");
const router = express.Router();
const DB = require("../../db");
const jwt = require("jsonwebtoken");
const make_dashboard = require("../make_dashboard_html");
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
    result.token = req.session.token;
    result.user_name = req.session.username;
    let is_auth = isAuthenticatied(req.session.token);
    if (is_auth) {
      result.expire = is_auth;
      res.render("./main/GroupPolicy/group", result);
    } else {
      res.redirect("/login");
    }
    //let len = result.recordset.length;
    //console.log(result.recordset[0]);
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
  let inspect_cd = JSON.parse(req.query["inspect_cd"]);
  DB.downloadhtml(inspect_cd).then(result => {
    let param = result.recordset[0];
    param["FILE_PATH"] = param["FILE_PATH"].replace(/\\/gi, "//");
    make_dashboard.buildHtml(param).then(result2 => {
      let filename =
        getTimeStamp(param["CREATE_TIME"]) +
        "_" +
        getTimeStamp(param["ACTIVE_TIME"]) +
        "_" +
        param["GROUP_SET_CD"][0] +
        "_" +
        param["IP"];
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

//그룹 정보 상세보기
router.get("/:name", (req, res, next) => {
  let is_auth = isAuthenticatied(req.session.token);
  if (is_auth) {
    DB.get_group_info(req.params.name).then(result => {
      DB.view_modify_group_info(req.params.name).then(result2 => {
        DB.view_xccdf_included_group(req.params.name).then(result3 => {
          result.expire = is_auth;
          console.log(result.recordset);
          console.log(result2.recordset);
          console.log(result3.recordset);
          res.render("./main/GroupPolicy/GroupInfo/groupinfo", {
            recordsets: result.recordset,
            recordsets2: result2.recordset,
            recordsets3: result3.recordset
          });
        });
      });
    });
  } else {
    res.redirect("/login");
  }
});

module.exports = router;
