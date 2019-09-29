let fs = require("fs");
let xmljs = require("xml2js");
let parser = new xmljs.Parser();
String.prototype.replaceAll = function(org, dest) {
    return this.split(org).join(dest);
  };
function leadingZeros(n, digits) {
    var zero = '';
    n = n.toString();
  
    if (n.length < digits) {
      for (i = 0; i < digits - n.length; i++)
        zero += '0';
    }
    return zero + n;
  }  
function getTimeStamp(d) {
    console.log(d)
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

function parseXml(filename){
    let xml = fs.readFileSync(`${__dirname}/${filename}`, "utf-8");
    let title_arr = [];
    let checkpoint_arr = [];
    let fix_arr = [];
    let severity_arr = [];
    parser.parseString(xml, (err, result) => {
        let data_stream = result["ds:data-stream-collection"]["ds:data-stream"];
        let component = result["ds:data-stream-collection"]["ds:component"];
        component.forEach(element => {
          if (typeof element["ocil"] != "undefined")
            // console.log(JSON.stringify(element["ocil"][0]["questionnaires"]));
          console.log("//////////////////////");
        });
        result["ds:data-stream-collection"]["ds:component"][2]["Benchmark"][0][
          "Group"
        ][0]["Group"].forEach(element => {
          // console.log(element['Rule'])
          element["Rule"].forEach(elem => {
            // 타이틀
            severity_arr.push(elem['$']['severity']);
            title_arr.push(elem["title"][0]["_"]);
            if (elem["description"][0]["html:pre"]) {
              // 판단 기준
              checkpoint_arr.push(elem["description"][0]["_"]
              .replaceAll("  ", "")
              .replaceAll("\t", " "));
              // 조치 방법
              fix_arr.push(elem["description"][0]["html:pre"][0]);
            }
          });
        });
      });
      return [title_arr,checkpoint_arr,fix_arr,severity_arr];
}


exports.buildHtml = row => {
  return new Promise((resolve, reject) => {
    fs.readFile(__dirname + "/sample.html", "utf-8", (err, html) => {
      if (err) {
        reject(err);
      }
      title_arr = [];
      checkpoint_arr = [];
      fix_arr = [];
      severity_arr= [];
      if(row['FILE_PATH']){
        new_arr = parseXml(row['FILE_PATH'].split('//')[row['FILE_PATH'].split('//').length - 1]);
        title_arr = new_arr[0];
        checkpoint_arr = new_arr[1];
        fix_arr = new_arr[2];
        severity_arr = new_arr[3];
      }
      let un_obey_cnt = row["ITEM_CNT"] - row["GRD_SCORE"];
      html = html.replace(/\$\{un_obey_cnt\}/gi, un_obey_cnt);
      html = html.replace(/\$\{AGENT_IP\}/gi, row["IP"]);
      html = html.replace(/\$\{AGENT_OS\}/gi, row["OS"]);
      if (typeof(row['CREATE_TIME']) == 'object' ){
        html = html.replace(/\$\{CREATE_TIME\}/gi, getTimeStamp( new Date(row["CREATE_TIME"])));
      }else{
        html = html.replace(/\$\{CREATE_TIME\}/gi, getTimeStamp( new Date(row["CREATE_TIME"][0])));
      }
      html = html.replace(/\$\{SUBMIT_DATE\}/gi, getTimeStamp( new Date(row["SUBMIT_DATE"])));
      html = html.replace(/\$\{GROUP_NO\}/gi, row["GROUP_SET_CD"][0]);
      html = html.replace(/\$\{STATE\}/gi, row["STATE"]);
      html = html.replace(/\$\{PURPOSE\}/gi, row["PURPOSE"]);
      if(typeof(row['NAME']) == "string"){
        html = html.replace(/\$\{GROUP_NAME\}/gi, row["NAME"]);
      }else{
        html = html.replace(/\$\{GROUP_NAME\}/gi, row["NAME"][0]);
      }
      html = html.replace(/\$\{GROUP_DESCRIPTION\}/gi, row["DISCRIPTION"][0]);
      html = html.replace(/\$\{FILE_NAME\}/gi, row["FILE_NAME"]);
      html = html.replace(/\$\{rule_no\}/gi, row["INSPECT_CD"]);
      html = html.replace(/\$\{pass_cnt\}/gi, row["GRD_SCORE"]);
      html = html.replace(/\$\{fail_cnt\}/gi, un_obey_cnt);
      html = html.replace(
        /\$\{pass_percent\}/gi,
        (row["GRD_SCORE"] / row["ITEM_CNT"]) * 100
      );
      html = html.replace(
        /\$\{fail_percent\}/gi,
        (un_obey_cnt / row["ITEM_CNT"]) * 100
      );


      agent_list_tr = "";
        for (let i = 0 ; i < title_arr.length ; i +=1){
            agent_list_tr += `<tr id="tr_${i}" class="agent_tr"><td style="padding-left: 57px";><a data-toggle="modal" href="#myModal"> ${title_arr[i]}</a></td><td class="rule-result rule-result-fail"><div><abbr title="The target system or system component did not satisfy at least one condition of the rule.">fail</abbr></div></td></tr>`
        }
        html = html.replace(/\$\{title_arr\}/gi, JSON.stringify(title_arr));
        html = html.replace('${checkpoint_arr}',JSON.stringify(checkpoint_arr));
        html = html.replace('${fix_arr}',JSON.stringify(fix_arr));
        html = html.replace('${severity_arr}',JSON.stringify(severity_arr));

        // console.log(html);
        html = html.replace(
            /\$\{agent_list\}/gi,
            agent_list_tr
        );


      resolve(html);
    });
  });
};

exports.make_html = row_arr => {
  let rows = row_arr;
  let paths = [];
  return new Promise((resolve, reject) => {
    for (let i = 0; i < rows.length; i += 1) {
      let elem = rows[i];
      let filename =
        elem["CREATE_TIME"].split("T")[0] +
        "_" +
        elem["ACTIVE_TIME"].split("T")[0] +
        "_" +
        elem["GROUP_SET_CD"][0] +
        "_" +
        elem["IP"];
      let stream = fs.createWriteStream(__dirname + "/" + filename + ".html");
      stream.once("open", fd => {
        self.buildHtml(elem).then(html => {
          stream.write(html);
          stream.end();
        });
      });
      stream.on("close", () => {
        paths.push(stream.path);
        if (paths.length == rows.length) {
          resolve(paths);
        }
      });
    }
  });
};
