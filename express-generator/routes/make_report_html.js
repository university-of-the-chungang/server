let fs = require("fs");
let xmljs = require("xml2js");
let DB = require("../db");

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
    let xml = fs.readFileSync(`${__dirname}/policy/${filename}`, "utf-8");
    let title_arr = [];
    let checkpoint_arr = [];
    let fix_arr = [];
    let severity_arr = [];
    parser.parseString(xml, (err, result) => {
        let data_stream = result["data-stream-collection"]["data-stream"];
        let component = result["data-stream-collection"]["component"];
        component.forEach(element => {
            if (typeof element["ocil"] != "undefined")
            // console.log(JSON.stringify(element["ocil"][0]["questionnaires"]));
                console.log("//////////////////////");
        });
        result["data-stream-collection"]["component"][1]["xccdf:Benchmark"].forEach(element => {
            element["xccdf:Rule"].forEach(elem => {
                // 타이틀
                severity_arr.push(elem['$']['severity']);
                title_arr.push(elem["xccdf:title"][0].replaceAll("  ", "")
                    .replaceAll("\n", " ")
                    .replaceAll("\r", "")
                    .replaceAll("[", "\[")
                    .replaceAll("]", "\]")
                    .replaceAll("<", "\<")
                    .replaceAll(">", "\>"));
                console.log(elem["xccdf:title"]);
                if (elem["xccdf:fixtext"]) {
                    // 판단 기준
                    fix_arr.push(elem["xccdf:fixtext"][0]["_"]
                        .replaceAll("  ", "")
                        .replaceAll("\n", " ")
                        .replaceAll("\r", "")
                        .replaceAll("[", "\[")
                        .replaceAll("]", "\]")
                        .replaceAll("<", "\<")
                        .replaceAll(">", "\>"));

                    // 조치 방법
                    //fix_arr.push(elem["description"][0]["html:pre"][0]);
                }
            });
        });
    });
    return [title_arr,checkpoint_arr,fix_arr,severity_arr];
}


exports.buildHtml = (row, row1) => {
    return new Promise((resolve, reject) => {
        console.log("buildHtml", row1);

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
            if (typeof(row['CREATE_TIME']) === 'object' ){
                html = html.replace(/\$\{CREATE_TIME\}/gi, getTimeStamp( new Date(row["CREATE_TIME"])));
            }else{
                html = html.replace(/\$\{CREATE_TIME\}/gi, getTimeStamp( new Date(row["CREATE_TIME"])));
            }
            html = html.replace(/\$\{SUBMIT_DATE\}/gi, getTimeStamp( new Date(row["SUBMIT_DATE"])));
            html = html.replace(/\$\{GROUP_NO\}/gi, row["GROUP_SET_CD"][0]);
            html = html.replace(/\$\{STATE\}/gi, row["STATE"]);
            html = html.replace(/\$\{PURPOSE\}/gi, row["PURPOSE"]);
            if(typeof(row['NAME']) == "string"){
                html = html.replace(/\$\{GROUP_NAME\}/gi, row["NAME"]);
            }else{
                html = html.replace(/\$\{GROUP_NAME\}/gi, row["NAME"]);
            }
            html = html.replace(/\$\{GROUP_DESCRIPTION\}/gi, row["DISCRIPTION"]);
            html = html.replace(/\$\{FILE_NAME\}/gi, row["FILE_NAME"]);
            html = html.replace(/\$\{rule_no\}/gi, row["INSPECT_CD"]);
            //html = html.replace(/\$\{pass_cnt\}/gi, row["GRD_SCORE"]);
            //html = html.replace(/\$\{fail_cnt\}/gi, un_obey_cnt);
            html = html.replace(
                /\$\{pass_percent\}/gi,
                (row["GRD_SCORE"] / row["ITEM_CNT"]) * 100
            );
            html = html.replace(
                /\$\{fail_percent\}/gi,
                (un_obey_cnt / row["ITEM_CNT"]) * 100
            );


            agent_list_tr = "";

            let success_cnt = 0;
            let fail_cnt = 0;
            let unknown_cnt = 0;

            inspect_fail = `<td class="rule-result rule-result-fail">
<div>
<abbr title="The target system or system component did not satisfy at least one condition of the rule.">fail</abbr>
</div>
</td>
</tr>`;
            inspect_success = `<td class="rule-result rule-result-pass">
<div>
<abbr title="The target system or system component satisfy condition of the rule.">success</abbr>
</div>
</td>
</tr>`;

            inspect_unknown = `<td class="rule-result rule-result-unknown">
<div>
<abbr title="The target system or system component cannot check condition of the rule.">unknown</abbr>
</div>
</td>
</tr>`;
            for (let i = 0 ; i < title_arr.length ; i +=1){
                agent_list_tr += `<tr>
<td id="tr_${i}" class="agent_tr" style="padding-left: 57px";>
<a data-toggle="modal" href="#myModal"> ${title_arr[i]}</a>
</td>`;
                if(row1[i]['INSPECT_RESULT'] === 1){
                    agent_list_tr += inspect_success;
                    success_cnt++;
                }else if(row1[i]['INSPECT_RESULT'] === 2){
                    agent_list_tr +=inspect_fail;
                    fail_cnt++;
                    console.log(row1[i]);
                }else{
                    agent_list_tr +=inspect_unknown;
                    unknown_cnt++;
                }
            }

            html = html.replace(/\$\{success_cnt\}/gi, success_cnt);
            html = html.replace(/\$\{fail_cnt\}/gi, fail_cnt);
            html = html.replace(/\$\{unknown_cnt\}/gi, unknown_cnt);

            let success_rate = success_cnt/row1.length * 100;
            let fail_rate = fail_cnt/row1.length*100;
            let unknown_rate = unknown_cnt/row1.length*100;
            html = html.replace(/\$\{success_rate\}/gi, success_rate+'%');
            html = html.replace(/\$\{fail_rate\}/gi, fail_rate+'%');
            html = html.replace(/\$\{unknown_rate\}/gi, unknown_rate+'%');

            html = html.replace(/\$\{title_arr\}/gi, title_arr);
            //html = html.replace(/\$\{checkpoint_arr\}/gi,checkpoint_arr);
            html = html.replace(/\$\{fix_arr\}/gi,fix_arr);
            html = html.replace(/\$\{severity_arr\}/gi,severity_arr);

            //console.log(html);

            html = html.replace(
                /\$\{agent_list\}/gi,
                agent_list_tr
            );
            resolve(html);
        });
    });
};

exports.make_html = (group_cd_arr, agent_cd_arr, inspect_cd_arr) => {
    console.log(group_cd_arr, agent_cd_arr, inspect_cd_arr);

    let paths = [];
    return new Promise((resolve, reject) => {
        for(let i=0; i<group_cd_arr.length; i+=1){
            DB.get_report_data(agent_cd_arr[i], inspect_cd_arr[i], group_cd_arr[i]).then(result2 => {
                let recordset = JSON.parse(JSON.stringify(result2.recordset).replace(/\\/gi, '/'));
                DB.get_inspect_survey(inspect_cd_arr[i], agent_cd_arr[i]).then(result3 => {
                    let filename = recordset[0]["CREATE_TIME"].split("T")[0] +
                        "_" +
                        recordset[0]["ACTIVE_TIME"].split("T")[0] +
                        "_" +
                        recordset[0]["GROUP_SET_CD"][0] +
                        "_" +
                        recordset[0]["IP"];

                    let stream = fs.createWriteStream(__dirname + "/" + filename + ".html");
                    stream.once("open", fd =>{
                        this.buildHtml(recordset[0], result3.recordset).then(html => {
                            stream.write(html);
                            stream.end();
                        });
                    });
                    stream.on("close", () => {
                        paths.push(stream.path);
                        if(paths.length === group_cd_arr.length){
                            resolve(paths);
                        }
                    })
                });
            });
        }

        /*for (let i = 0; i < group_cd_arr.length; i += 1) {
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
        }*/

    });
};
