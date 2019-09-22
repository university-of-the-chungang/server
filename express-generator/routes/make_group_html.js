let fs = require("fs");
Date.prototype.format = function(f) {
  if (!this.valueOf()) return " ";

  var weekKorName = [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일"
  ];

  var weekKorShortName = ["일", "월", "화", "수", "목", "금", "토"];

  var weekEngName = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  var weekEngShortName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  var d = this;

  return f.replace(/(yyyy|yy|MM|dd|KS|KL|ES|EL|HH|hh|mm|ss|a\/p)/gi, function(
    $1
  ) {
    switch ($1) {
      case "yyyy":
        return d.getFullYear(); // 년 (4자리)

      case "yy":
        return (d.getFullYear() % 1000).zf(2); // 년 (2자리)

      case "MM":
        return (d.getMonth() + 1).zf(2); // 월 (2자리)

      case "dd":
        return d.getDate().zf(2); // 일 (2자리)

      case "KS":
        return weekKorShortName[d.getDay()]; // 요일 (짧은 한글)

      case "KL":
        return weekKorName[d.getDay()]; // 요일 (긴 한글)

      case "ES":
        return weekEngShortName[d.getDay()]; // 요일 (짧은 영어)

      case "EL":
        return weekEngName[d.getDay()]; // 요일 (긴 영어)

      case "HH":
        return d.getHours().zf(2); // 시간 (24시간 기준, 2자리)

      case "hh":
        return ((h = d.getHours() % 12) ? h : 12).zf(2); // 시간 (12시간 기준, 2자리)

      case "mm":
        return d.getMinutes().zf(2); // 분 (2자리)

      case "ss":
        return d.getSeconds().zf(2); // 초 (2자리)

      case "a/p":
        return d.getHours() < 12 ? "오전" : "오후"; // 오전/오후 구분

      default:
        return $1;
    }
  });
};
String.prototype.string = function(len) {
  var s = "",
    i = 0;
  while (i++ < len) {
    s += this;
  }
  return s;
};

String.prototype.zf = function(len) {
  return "0".string(len - this.length) + this;
};

Number.prototype.zf = function(len) {
  return this.toString().zf(len);
};
exports.buildHtml = row => {
  return new Promise((resolve, reject) => {
    fs.readFile(
      __dirname + "/html_templates/group_sample.html",
      "utf-8",
      (err, html) => {
        if (err) {
          reject(err);
        }
        console.log(row);
        html = html.replace(/\${NAME}/gi, row[0]["NAME"]);
        if (typeof(row[0]['CREATE_TIME']) != 'undefined') 
            html = html.replace(/\${CREATE_TIME}/gi, row[0]["CREATE_TIME"].format("yyyy-MM-dd(KS) HH:mm:ss"));
        
        html = html.replace(/\${GROUP_SET_CD}/gi, row[0]["GROUP_SET_CD"]);
        html = html.replace(/\${DESCRIPTION}/gi, row[0]["DISCRIPTION"]);
        html = html.replace(/\${AGENT_COUNTING}/gi, row[0]["AGENT_COUNTING"]);
        
        if (typeof(row[0]['INSPECTION_START_DATE']) != 'undefined') 
            html = html.replace(
                /\${INSPECTION_START_DATE}/gi,
                row[0]["INSPECTION_START_DATE"].format("yyyy-MM-dd(KS) HH:mm:ss")
                );
        html = html.replace(/\${INSPECTION_PERIOD}/gi, row[0]["INSPECTION_PERIOD"]);
        new_html = '';
        for(let i = 0 ; i< row.length ; i+=1){

            let success = 0 
            let fail = 0;
            let total = row[i]['AGENT_COUNTING'];
            if(total){
            success = row[i]['GRD_SCORE'];
            fail = total - success;
            }else{
                total = 0;
            }
            new_html += `
            <tr>
            <td>${row[i]['IP']}</td><td>${row[i]['STATE']}</td><td>${row[i]['OS']}</td><td>${row[i]['DESCRIPTION']}</td><td><div class="progress"><div class="progress-bar progress-bar-success" style="width: ${success/total * 100}%">${success}
            </div><div class="progress-bar progress-bar-danger" style="width: ${fail / total * 100}%">${fail} failed
            </div></div></td><td>높음,중간,낮음 몇개</td>
            </tr>
            `;
        }
        html = html.replace(/\${TR}/gi,new_html);

        // let un_obey_cnt = row['ITEM_CNT'] - row['GRD_SCORE'];
        // html = html.replace(/\$\{un_obey_cnt\}/gi, un_obey_cnt);
        // html = html.replace(/\$\{AGENT_IP\}/gi, row['IP']);
        // html = html.replace(/\$\{AGENT_OS\}/gi, row['OS']);
        // html = html.replace(/\$\{rule_no\}/gi, row['INSPECT_CD']);
        // html = html.replace(/\$\{pass_cnt\}/gi, row['GRD_SCORE']);
        // html = html.replace(/\$\{fail_cnt\}/gi, un_obey_cnt);
        // html = html.replace(/\$\{pass_percent\}/gi, row['GRD_SCORE'] / row['ITEM_CNT'] * 100);
        // html = html.replace(/\$\{fail_percent\}/gi, un_obey_cnt / row['ITEM_CNT'] * 100);

        resolve(html);
      }
    );
  });
};

// exports.make_html = (row_arr) => {
//     let rows = row_arr;
//     let paths = [];
//     return new Promise((resolve, reject) => {
//         for (let i = 0; i < rows.length; i += 1) {
//             let elem = rows[i];
//             let filename = elem['CREATE_TIME'].split('T')[0] + '_' + elem['ACTIVE_TIME'].split('T')[0] + '_' + elem['GROUP_SET_CD'][0] + '_' + elem['IP'];
//             let stream = fs.createWriteStream(__dirname + '/' + filename + ".html");
//             stream.once('open', (fd) => {
//                 self.buildHtml(elem).then(html => {
//                     stream.write(html);
//                     stream.end();
//                 })
//             });
//             stream.on('close', () => {
//                 paths.push(stream.path);
//                 if(paths.length == rows.length){
//                 resolve(paths);
//                 }

//             })
//         }

//     })
// }