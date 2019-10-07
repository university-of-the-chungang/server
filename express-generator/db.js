/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
let sql = require('mssql');
let fs = require("fs");
let xmljs = require("xml2js");
let parser = new xmljs.Parser();
// DB 정보 

let config = {
    // 해당 설정 부분은 설정파일 생기면 그리 옮길것 
    "user": "developer", //default is sa
    "password": "ang0511",
    "server": "52.231.199.26", // for local machine
    // "server": "localhost", // for local machine
    "port": 1444,
    "database": "nsrang", // name of database
    "options": {
        "encrypt": true
    }
};
let table_list = [];
sql.connect(config, err => {
    if (err) {
        throw err;
    }
    console.log("Connection Successful !");

    new sql.Request().query("select name from sysobjects where type='U' ", (err, result) => {
        if (err) {
            console.log("Tables Loading Failed .");
        } else {
            // console.dir(result['recordsets'])
            result['recordsets'][0].some((record) => {
                if (record.name !== "sysdiagrams") {
                    table_list.push(record.name);
                }
            });
            console.log(String(table_list.length) + " Tables Loading Successed .");
            // view_admin("*")
        }
    });

});

sql.on('error', err => {
    // ... error handler 
    console.log("Sql database connection error ", err);
})





let query_select = (data, table_name,where) => {
    return new Promise((resolve, reject) => {
        new sql.Request().query(`SELECT ` + String(data) + ` FROM ` + table_name + where, (err, result) => {
            if (result) {
                resolve(result);
            } else {
                reject(err);
            }
        });
    });

};
exports.delete_policy = (xccdf_cd)=>{
    console.log(`DELETE FROM TBL_XCCDF WHERE XCCDF_CD IN (${xccdf_cd})`);
    return new Promise((resolve,reject)=>{
       new sql.Request().query(`DELETE FROM TBL_XCCDF WHERE XCCDF_CD IN (${xccdf_cd})`,(err,result)=>{
           if(err){
               reject(err);
           }else{
               resolve(result);
           }
       }) 
    })
}

exports.get_policy_info = ()=>{
    return new Promise((resolve,reject)=>{
        new sql.Request().query(`SELECT * FROM TBL_XCCDF AS T1 LEFT OUTER JOIN TBL_XCCDF_SET_LIST AS T2 ON T1.XCCDF_CD = T2.XCCDF_CD LEFT OUTER JOIN TBL_GROUP_INFO AS T3 ON T2.GROUP_SET_CD = T3.GROUP_SET_CD`,(err,result)=>{
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

exports.add_policy = (policy_name, policy_os, policy_filepath)=>{
    return new Promise((resolve,reject)=>{
        new sql.Request().query(`INSERT INTO TBL_XCCDF (FILE_NAME,FILE_PATH,INSPECT_OS) VALUES(N'${policy_name}', N'${policy_filepath}', N'${policy_os}'); SELECT SCOPE_IDENTITY() AS XCCDF_CD;`,(err,res)=>{
            if(err){
                console.log(err);
                reject(err);
            }else{
                console.log(`${__dirname}\\routes\\${policy_filepath.split('\\')[policy_filepath.split('\\').length-1]}`);
                let xml = fs.readFileSync(`${__dirname}\\routes\\${policy_filepath.split('\\')[policy_filepath.split('\\').length-1]}`, "utf-8");
                let severity_arr = [];
                let id_arr = [];
                parser.parseString(xml, (err, result) => {
                    result["ds:data-stream-collection"]["ds:component"][2]["Benchmark"][0][
                    "Group"][0]["Group"].forEach(element => {
                    // console.log(element['Rule'])
                    element["Rule"].forEach(elem => {
                        severity_arr.push(elem['$']['severity']);
                        id_arr.push(elem['$']['id']);
                    });
                    });
                    id_arr.forEach((elem,idx)=>{
                        new sql.Request().query(`
                        IF NOT EXISTS(SELECT XCCDF_CD, XCCDF_ITEM_CODE, SEVERITY FROM TBL_XCCDF_ITEM WHERE XCCDF_CD = ${res.recordset[0]['XCCDF_CD']} AND XCCDF_ITEM_CODE = N'${elem}' AND SEVERITY = N'${severity_arr[idx]}')
                        BEGIN
                            INSERT INTO TBL_XCCDF_ITEM (XCCDF_CD,XCCDF_ITEM_CODE, SEVERITY) VALUES (N'${res.recordset[0]['XCCDF_CD']}', N'${elem}', N'${severity_arr[idx]}')
                        END
                        `,(err2,result2)=>{
                            if (err2){
                                reject(err2);
                            }
                        });
                    });
                    resolve(1);
                });
            }
        })
    })
};

exports.add_log = (log_type,contents,date)=>{
    return new Promise((resolve,reject)=>{
        console.log(`INSERT INTO TBL_LOG(LOG_TYPE,CONTENTS,CONTENT_DATE) VALUES('${log_type}',N'${contents}',CONVERT(DATETIME,'${date}'))`);
        new sql.Request().query(`INSERT INTO TBL_LOG(LOG_TYPE,CONTENTS,CONTENT_DATE) VALUES('${log_type}',N'${contents}',CONVERT(DATETIME,'${date}'))`,(err,result)=>{
            if(err){
                console.log(err);
            }else
            resolve(result);
        });
    });
};
exports.login_admin = (login_name, login_pw) => {
    return new Promise((resolve, reject) => {
        if (login_name.length <= 0 || login_pw.length <= 0) {
            reject("Please fill the blank.");
        }
        else {
            new sql.Request().query(`SELECT COUNT(ID) AS login_result FROM TBL_ADMIN_INFO WHERE NAME = '` + login_name + `' AND PASSWD = '` + login_pw + `'`, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.recordsets[0][0].login_result);
                }
            });
        }
    });
}
exports.get_inspect_stats = (group_set_cd, agent_cd = null) => {
    // group_set_cd를 가진 점검 결과를 검색
    let adder = "";
    if(agent_cd != null){
        adder = `AND TBL_INSPECT_STATS.AGENT_CD = ${agent_cd}`;
    }
    return new Promise((resolve, reject) => {
        new sql.Request().query(`SELECT * FROM TBL_INSPECT_STATS WHERE GROUP_SET_CD = '` + group_set_cd + "'" + adder, (err, result) => {
            if (err) {
                reject(err);
            }
            console.log(result);
            resolve(result);
        });
    });
}

exports.get_group_agents = (group_set_cd) => {
    // 그룹생성코드가 group_set_cd인 Agent CD를 검색
    return new Promise((resolve, reject) => {
        new sql.Request().query(`SELECT AGENT_CD FROM TBL_GROUP_SET_LIST WHERE GROUP_SET_CD = '` + group_set_cd + "'", (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}
exports.get_dashboard_datas = ()=>{
    //대쉬보드에 쓸 데이터 조회 
    // query = "SELECT * FROM TBL_AGENT_INFO t1 LEFT OUTER JOIN TBL_INSPECT_SURVEY t2 ON t1.AGENT_CD = t2.AGENT_CD LEFT OUTER JOIN TBL_INSPECT_STATS t3 ON t2.INSPECT_CD = t3.INSPECT_CD LEFT OUTER JOIN TBL_GROUP_INFO t4 ON t3.GROUP_SET_CD = t4.GROUP_SET_CD WHERE t1.DEL_FLAG = 0 ORDER BY IP";
    // query = `SELECT * FROM TBL_AGENT_INFO T1 
    // LEFT OUTER JOIN TBL_GROUP_SET_LIST T2 ON T1.AGENT_CD = T2.AGENT_CD 
    // LEFT OUTER JOIN TBL_GROUP_INFO T3 ON T2.GROUP_SET_CD = T3.GROUP_SET_CD 
    // LEFT OUTER JOIN TBL_INSPECT_STATS T4 ON T1.AGENT_CD = T4.AGENT_CD 
    // INNER JOIN TBL_XCCDF_SET_LIST T5 ON T3.GROUP_SET_CD = T5.GROUP_SET_CD
    // LEFT OUTER JOIN TBL_XCCDF T6 ON T5.XCCDF_CD = T6.XCCDF_CD 
    // WHERE T3.ACTIVE_STATE = 'A'AND T1.DEL_FLAG = 0 AND T3.DEL_FLAG = 0 
    // ORDER BY T3.CREATE_TIME DESC`;
    
    query = `SELECT * FROM TBL_AGENT_INFO T1 
    INNER JOIN TBL_GROUP_SET_LIST T2 ON T1.AGENT_CD = T2.AGENT_CD 
    INNER JOIN TBL_GROUP_INFO T3 ON T2.GROUP_SET_CD = T3.GROUP_SET_CD 
	LEFT OUTER JOIN TBL_XCCDF T6 ON T2.XCCDF_CD = T6.XCCDF_CD
	LEFT OUTER JOIN (
					SELECT GRD_SCORE,ITEM_CNT,SUBMIT_DATE, T4.AGENT_CD, INSPECT_RESULT FROM TBL_INSPECT_SURVEY T4 
					INNER JOIN TBL_INSPECT_STATS T5 ON T4.INSPECT_CD = T5.INSPECT_CD
					
					) B
	ON B.AGENT_CD = T1.AGENT_CD
    WHERE T3.ACTIVE_STATE = 'A' AND T1.DEL_FLAG = 0 AND T3.DEL_FLAG = 0
    ORDER BY T3.CREATE_TIME DESC`;
    return new Promise((resolve,reject)=>{
        new sql.Request().query(query,(err,result)=>{
            console.log(result);
            if(err){
                reject(err);
            }
            console.log(result);
            resolve(result);
        })
    })
};
exports.get_dashboard_top10 = ()=>{
    // query = "SELECT top 10 count(*) as cnt, INSPECT_ITEM_CD item_cd FROM TBL_INSPECT_SURVEY  WHERE INSPECT_RESULT = 0 GROUP BY INSPECT_ITEM_CD ORDER BY cnt DESC ";
    query = "SELECT TOP 10 COUNT(*) cnt, T5.INSPECT_ITEM_CD AS item_cd FROM TBL_AGENT_INFO T1 INNER JOIN TBL_GROUP_SET_LIST T2 ON T1.AGENT_CD = T2.AGENT_CD INNER JOIN TBL_GROUP_INFO T3 ON T2.GROUP_SET_CD = T3.GROUP_SET_CD INNER JOIN TBL_INSPECT_STATS T4 ON T1.AGENT_CD = T4.AGENT_CD INNER JOIN TBL_INSPECT_SURVEY T5 ON T4.INSPECT_CD = T5.INSPECT_CD  WHERE T5.INSPECT_RESULT = 0 AND T1.DEL_FLAG = 0 AND T3.DEL_FLAG = 0 AND T3.ACTIVE_STATE = 'A' GROUP BY INSPECT_ITEM_CD ORDER BY cnt DESC ";
    
    return new Promise((resolve,reject)=>{
        new sql.Request().query(query,(err,result)=>{
            if(err){
                reject(err);
            }
            resolve(result);
        })
    })
}
exports.get_agents_from_group_cd = (group_cd=null,agent_cd=null)=>{
    let adder = "";
    if(agent_cd != null){
        adder = `AND TBL_INSPECT_STATS.AGENT_CD = ${agent_cd}`;
    }

    return new Promise((resolve,reject)=>{
        new sql.Request().query(`SELECT TBL_AGENT_INFO.AGENT_CD,NAME, IP, MAC_ADDR, OS, PURPOSE, OWNER, STATE, TBL_AGENT_INFO.DEL_FLAG, TBL_GROUP_INFO.DEL_FLAG, DESCRIPTION, TBL_GROUP_SET_LIST.GROUP_SET_CD, CREATE_TIME,ACTIVE_TIME, INSPECTION_START_DATE, INSPECTION_PERIOD, GRD_SCORE,ITEM_CNT,SUBMIT_DATE, AGENT_COUNTING, DISCRIPTION
        FROM TBL_AGENT_INFO 
        INNER JOIN TBL_GROUP_SET_LIST ON TBL_AGENT_INFO.AGENT_CD = TBL_GROUP_SET_LIST.AGENT_CD 
        INNER JOIN TBL_GROUP_INFO ON TBL_GROUP_SET_LIST.GROUP_SET_CD = TBL_GROUP_INFO.GROUP_SET_CD
        LEFT OUTER JOIN TBL_INSPECT_STATS ON TBL_AGENT_INFO.AGENT_CD = TBL_INSPECT_STATS.AGENT_CD 
        WHERE TBL_GROUP_SET_LIST.GROUP_SET_CD = ${group_cd} AND TBL_GROUP_SET_LIST.GROUP_SET_CD = ${group_cd} AND TBL_INSPECT_STATS.GROUP_SET_CD = ${group_cd} ${adder}`, (err,result)=>{
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
}

exports.get_agent_info = (agent_cd = null) => {
    // 에이전트 코드가 agent_cd인 Agent들의 정보를 검색
    // agent_cd를 넣지않으면 전체검색
    sql_adder = "";
    if (agent_cd) {
        sql_adder = " WHERE ( AGENT_CD = '" + agent_cd + "' ) AND DEL_FLAG = 0";
    }else{
        sql_adder = " WHERE DEL_FLAG = 0";
    }
    return new Promise((resolve, reject) => {
        new sql.Request().query(`SELECT * FROM TBL_AGENT_INFO` + sql_adder, (err, result) => {
            // console.log(`SELECT * FROM TBL_AGENT_INFO` + sql_adder);
            if (err) {
                print(err);
            }
            // console.log(result);
            resolve(result);
        });
    });
}

exports.get_log_info = (log_id = null) => {
    // 에이전트 코드가 agent_cd인 Agent들의 정보를 검색
    // agent_cd를 넣지않으면 전체검색
    sql_adder = "";
    if (log_id) {
        //sql_adder = " WHERE ( AGENT_CD = '" + agent_cd + "' ) AND DEL_FLAG = 0";
        sql_adder = " WHERE ( LOG_ID = '" + log_id + "' )";
    }else{
        //sql_adder = " WHERE DEL_FLAG = 0";
        sql_adder = "";
    }
    return new Promise((resolve, reject) => {
        new sql.Request().query(`SELECT * FROM TBL_LOG` + sql_adder, (err, result) => {
            //console.log(`SELECT * FROM TBL_LOG` + sql_adder);
            if (err) {
                print(err);
            }
            //console.log(result);
            resolve(result);
        });
    });
}

exports.search_agent_info = (keyword = "") => {
    let search_key = `LIKE '%${keyword}%'`;
    let query = `
    SELECT * FROM TBL_AGENT_INFO WHERE ( IP ${search_key} OR MAC_ADDR ${search_key} OR OS ${search_key}
    OR PURPOSE ${search_key} OR OWNER ${search_key} OR DESCRIPTION ${search_key} ) AND DEL_FLAG = 0
    `;
    return new Promise((resolve, reject) => {
        new sql.Request().query(query, (err, result) => {
            if (err)
                reject(err);
            resolve(result);
        });
    });
}

exports.get_PGMH_info = (keyword2 = "") => {
    // 그룹 정보 조회
    let search_key = `LIKE '%${keyword2}%'`;
    let query = `SELECT * FROM TBL_GROUP_INFO WHERE ( NAME ${search_key} OR AGENT_COUNTING ${search_key} )`;
    return new Promise((resolve, reject) => {
        new sql.Request().query(query, (err, result) => {
            if (err)
                reject(err);
            console.log(query);
            resolve(result);
        });
    });
}

exports.search_log_info = (obj)=>{
    let qry = '';
    if (obj['start_date'] && obj['end_date']){
        qry = `SELECT * FROM TBL_LOG WHERE CONTENT_DATE BETWEEN '${obj['start_date']} 00:00:00' AND '${obj['end_date']} 23:59:59'`;
        if(obj['search_keyword'] && obj['search_keyword'].length > 0){
            qry += ` AND (LOG_ID LIKE '%${obj['search_keyword']}%' OR LOG_TYPE LIKE '%${obj['search_keyword']}%' OR CONTENTS LIKE '%${obj['search_keyword']}%')`;
        }
        
    }else{
        if(obj['search_keyword'] && obj['search_keyword'].length > 0){
            qry = `SELECT * FROM TBL_LOG WHERE LOG_ID LIKE '%${obj['search_keyword']}%' OR LOG_TYPE LIKE '%${obj['search_keyword']}%' OR CONTENTS LIKE '%${obj['search_keyword']}%'`;
        }
    }
    return new Promise((resolve,reject)=>{
        new sql.Request().query(qry,(err,result)=>{
            if(err)
                reject(err);
            resolve(result);
        });
    })
}


exports.search_logDate_info = (keyword2 = "") => {
    let search_key = `between '${keyword2} 00:00:00' and '${keyword2} 23:59:59'`;
    let query = `SELECT * FROM TBL_LOG WHERE CONTENT_DATE ${search_key} `;
    return new Promise((resolve, reject) => {
        new sql.Request().query(query, (err, result) => {
            if (err)
                reject(err);
            console.log(query);
            console.log(result)
            resolve(result);
        });
    });
}

exports.delete_agent_info = (agent_cd_arr)=>{
    let adder = agent_cd_arr.join(' OR AGENT_CD = ');

    let query = `
    UPDATE TBL_AGENT_INFO SET DEL_FLAG = 1 WHERE AGENT_CD = ${adder}
    `;
    console.log(query);
    return new Promise((resolve, reject) => {
        new sql.Request().query(query, (err, result) => {
            if (err)
                reject(err);
            resolve(result);
        });
    });
}


exports.insert_group_set_list = (group_set_cd, agent_cd) => {
    return new Promise((resolve, reject) => {
        let query = `INSERT INTO TBL_GROUP_SET_LIST (GROUP_SET_CD, AGENT_CD) VALUES (` + group_set_cd + `, ` + agent_cd +`)`;
        console.log(query);
        console.log(agent_cd);
        new sql.Request().query(query, (err,result) => {
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
};

exports.update_group_info = (cd, name, start_date, period, disc) => {
    return new Promise((resolve, reject) =>{
        let adder = "";
        if(start_date === "")
            console.log(start_date);
        else
            adder = ", INSPECTION_START_DATE = " + "'" +start_date + "'";

        let query = `UPDATE TBL_GROUP_INFO SET NAME = N'${name}', INSPECTION_PERIOD='${period}', DISCRIPTION = N'${disc}'`+ adder + ` WHERE GROUP_SET_CD = '${cd}'`;
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
};

exports.get_group_info = (group_name = null) => {
    // 그룹 정보 조회
    return new Promise((resolve, reject) => {
        sql_adder = "";
        if (group_name) {
            sql_adder = "WHERE NAME LIKE N'" + group_name + "%'";

        }
        new sql.Request().query(`SELECT * FROM TBL_GROUP_INFO ` + sql_adder, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

exports.set_policy = (group_cd, agent_cd, policy_cd) => {
    return new Promise((resolve, reject) => {
        let query = `UPDATE TBL_GROUP_SET_LIST SET XCCDF_CD = ` + String(policy_cd) + ` WHERE GROUP_SET_CD = ` + String(group_cd) + ` AND AGENT_CD = ` + String(agent_cd);
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
};


exports.view_admin = (column_name,where="") => {
    return new Promise((resolve, reject) => {
        query_select(column_name, "TBL_ADMIN_INFO",where).then((result) => {
            resolve(result);
        }).catch(e => {
            reject(e);
        });
    });
};
// 그룹 점검 활성화/비활성화 (default : 비활성화)
exports.change_group_state = (group_set_cd, state = false) => {
    return new Promise((resolve, reject) => {
        let query = `UPDATE TBL_GROUP_INFO SET ACTIVE_STATE = `;
        query += state ? `'A'` : `'D'`;
        query += ` WHERE GROUP_SET_CD = ` + group_set_cd;
        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
};

// 그룹 정보 삭제 (데이터베이스에서 날리지 않고 DEL_FLAG를 1로 설정)
exports.delete_group_info = (group_set_cd) => {
    return new Promise((resolve, reject) => {
        let query = `UPDATE TBL_GROUP_INFO SET DEL_FLAG = 1, ACTIVE_STATE = 'D' WHERE GROUP_SET_CD = ` + group_set_cd;
        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}
//몇번째 XCCDF_CD인지 조회 
exports.get_new_xccdf_cd = () => {
    return new Promise((resolve, reject) => {
        let query = `SELECT COUNT(XCCDF_CD) as cnt FROM TBL_XCCDF`;
        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject({ new_xccdf_cd: err });
            }
            resolve({ new_xccdf_cd: result.recordset[0].cnt + 1 });
        });
    });
};

exports.put_xccdf = (xccdf_cd, file_name, file_path, inspect_os) => {
    return new Promise((resolve, reject) => {
        let query = `INSERT INTO TBL_XCCDF (XCCDF_CD, FILE_NAME, FILE_PATH, INSPECT_OS) VALUES (` + xccdf_cd + `, N'` + file_name + `', '` + file_path + `', '` + inspect_os + `')`;
        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject({ new_xccdf_cd: err });
            }
            resolve({ new_xccdf_cd: result });
        });
    });
};

exports.view_tbl_xccdf = () => {
    return new Promise((resolve, reject) => {
        new sql.Request().query(`SELECT * FROM TBL_XCCDF `, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}
exports.mapping_xccdf_group = (xccdf_cd, group_set_cd) => {
    return new Promise((resolve, reject) => {
        let query = `INSERT INTO TBL_XCCDF_SET_LIST (GROUP_SET_CD, XCCDF_CD) VALUES (` + group_set_cd + `, ` + xccdf_cd + `)`;
        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject({ mapping_xccdf_group: err });
            }
            resolve({ mapping_xccdf_group: result });
        });
    });
};
exports.view_tbl_xccdf_set_list = () => {
    return new Promise((resolve, reject) => {
        new sql.Request().query(`SELECT * FROM TBL_XCCDF_SET_LIST `, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}
exports.add_admin = (data) => {
    return new Promise((resolve, reject) => {
        let query = `INSERT INTO TBL_ADMIN_INFO (NAME, PASSWD, TEL_NO, EMAIL, DIVISION, POSITION, LOCK_STAT,  ROLE_CD, LOCK_COUNT, LOCK_DATE, LAST_LOGIN) VALUES(`;
        let arr = [];
        arr.push(`'` + data.name + `'`);
        arr.push(`'` + data.passwd + `'`);
        arr.push(`'` + data.tel_no + `'`);
        arr.push(`'` + data.email + `'`);
        arr.push(`'` + data.division + `'`);
        arr.push(`'` + data.position + `'`);
        arr.push(data.lock_stat);
        arr.push(`NULL`);
        arr.push(data.lock_count);
        arr.push(`NULL`);
        arr.push(`NULL`);
        query += arr.join(", ");
        query += `)`
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        })
    });
};

exports.add_group_info = (name, create_time, active_time, agent_counting, inspection_period, DESCRIPTION) => {
    return new Promise((resolve, reject) => {
        let query = `INSERT INTO TBL_GROUP_INFO (NAME, CREATE_TIME, ACTIVE_TIME, AGENT_COUNTING, ACTIVE_STATE, INSPECTION_PERIOD, DEL_FLAG, DESCRIPTION) 
        VALUES (N'`+ name + `', CONVERT(CHAR(19), '` + create_time + `', 20), CONVERT(CHAR(19), '` + active_time + `',20), ` + agent_counting + `, 'A',  CONVERT(CHAR(19),'` + inspection_period + `', 20), 0, N'` + DESCRIPTION + `')`;

        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });

};


// 그룹 관련 DB API
exports.create_group_home = (group_name, group_desc, group_date, group_period, cd_list) => {
    return new Promise((resolve, reject) => {
        let query =
            `
            INSERT INTO TBL_GROUP_INFO (NAME, DISCRIPTION, INSPECTION_START_DATE, INSPECTION_PERIOD, AGENT_COUNTING)
            VALUES (N'` + group_name + `',N'` + group_desc + `','` + group_date + `','` + group_period + `','` + String(cd_list.length) + `')
            `;

        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    })
};
exports.get_group_id = () => {
    return new Promise((resolve, reject) => {
        let query =
            `
            SELECT GROUP_SET_CD 
            FROM TBL_GROUP_INFO 
            ORDER BY GROUP_SET_CD 
            DESC
            `;

        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    })
};
exports.set_group_agent_mapping = (group_agent_mapping) => {
    return new Promise((resolve, reject) => {
        let query =
            `
            INSERT INTO TBL_GROUP_SET_LIST (GROUP_SET_CD, AGENT_CD)
            VALUES 
            `;

        for (let group_agent of group_agent_mapping) {
            query += `(` + String(group_agent[0]) + `,` + group_agent[1] + `),`
        }

        query = query.substr(0, query.length - 1);

        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    })
};



exports.add_agent_info = (ip, mac, os, purpose, owner, desc, state) => {
    return new Promise((resolve, reject) => {
        let check_query = `SELECT COUNT(*) as cnt FROM TBL_AGENT_INFO WHERE IP = '${ip}'`;
        new sql.Request().query(check_query,(err,result)=>{
            console.log(check_query);
            console.log(result);
            if(result['recordsets']['cnt'] > 0){
                reject(err);
            }else{
                let query = `INSERT INTO TBL_AGENT_INFO (IP, MAC_ADDR, OS, PURPOSE, OWNER, DEL_FLAG, DESCRIPTION, STATE ) VALUES('` + ip + `', '` + mac + `', '` + os + `', N'` + purpose + `', N'` + owner + `', 0, N'` + desc + `', '` + state + `')`;
                new sql.Request().query(query, (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(result);
                });
            }

        });
        
    });
};

exports.add_agent_info_from_xlsx = (ip,purpose,owner)=>{
    return new Promise((resolve,reject)=>{
        let query = `INSERT INTO TBL_AGENT_INFO (IP, PURPOSE, OWNER) VALUES( '${ip}', N'${purpose}', '${owner}')`;
        console.log(query);
        new sql.Request().query(query,(err,result)=>{
            resolve(result);
        });
    });
};

exports.update_agent_info = (cd, purpose, owner) => {
    return new Promise((resolve, reject) => {
        let query = `UPDATE TBL_AGENT_INFO SET PURPOSE = N'${purpose}', OWNER = N'${owner}' WHERE AGENT_CD = '${cd}'`;
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject(err);
            }

            resolve(result);
        });
    });
};

exports.change_group_agent_counting = (cd, count) => {
    return new Promise((resolve, reject) =>{
        let query = `UPDATE TBL_GROUP_INFO SET AGENT_COUNTING = ${count} WHERE GROUP_SET_CD = '${cd}'`
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
};

exports.activate_agent_info = (agent_cd) => {
    return new Promise((resolve, reject) => {
        let query = `UPDATE TBL_AGENT_INFO SET STATE = 'C-2' WHERE AGENT_CD = ${agent_cd}`;
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

exports.activate_group_info = (group_set_cd, state) =>{
    let ch_state;

    if(state === 'D')
        ch_state = 'A';
    else
        ch_state = 'D';

    return new Promise((resolve, reject) =>{
        let query = `UPDATE TBL_GROUP_INFO SET ACTIVE_STATE = '` + ch_state + `' WHERE GROUP_SET_CD = ${group_set_cd}`;
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if(err){
                reject(err);
            }

            resolve(result);
        });
    });
};

exports.total_group_info = () =>{
    return new Promise((resolve,reject)=>{
        let query = `SELECT GROUP_SET_CD, NAME, CREATE_TIME, ACTIVE_TIME, AGENT_COUNTING, INSPECTION_PERIOD, ACTIVE_STATE, DISCRIPTION FROM TBL_GROUP_INFO WHERE DEL_FLAG = 0`;
        console.log(query);
        new sql.Request().query(query,(err,result)=>{
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
};
exports.downloadhtml= (inspect_cd)=>{
    return new Promise((resolve,reject)=>{
        let query = `
        SELECT 
            * 
        FROM 
            TBL_GROUP_INFO t1
            INNER JOIN
                TBL_GROUP_SET_LIST t2
            ON
                t1.GROUP_SET_CD = t2.GROUP_SET_CD
            INNER JOIN
                TBL_AGENT_INFO t3
            ON
                t2.AGENT_CD = t3.AGENT_CD
            INNER JOIN
                TBL_INSPECT_STATS t4 
            ON t1.GROUP_SET_CD = t4.GROUP_SET_CD AND t3.AGENT_CD = t4.AGENT_CD
			INNER JOIN 
				TBL_XCCDF t5
			ON t2.XCCDF_CD = t5.XCCDF_CD
        WHERE
            t4.INSPECT_CD = ${inspect_cd}
        `;
        new sql.Request().query(query,(err,result)=>{
            if(err){
                console.log(err);
                reject(err);
            }
            resolve(result);
        });
    })

}
//그룹 수정 페이지 정보 띄우기
exports.view_modify_group_info = (group_name) => {
    return new Promise((resolve, reject) => {
        let query = `Select *
From  (TBL_GROUP_SET_LIST inner join TBL_AGENT_INFO on TBL_GROUP_SET_LIST.AGENT_CD = TBL_AGENT_INFO.AGENT_CD) 
inner join TBL_GROUP_INFO t1 On t1.GROUP_SET_CD = TBL_GROUP_SET_LIST.GROUP_SET_CD
Where t1.NAME = N'${group_name}' AND TBL_AGENT_INFO.DEL_FLAG = 0` ;
        new sql.Request().query(query, (err, result) => {
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
};

exports.view_group_for_report = (group_name) => {
    return new Promise((resolve, reject) => {
        let query = `Select *
From  (TBL_GROUP_SET_LIST inner join TBL_AGENT_INFO on TBL_GROUP_SET_LIST.AGENT_CD = TBL_AGENT_INFO.AGENT_CD) 
inner join TBL_GROUP_INFO t1 On t1.GROUP_SET_CD = TBL_GROUP_SET_LIST.GROUP_SET_CD
LEFT OUTER JOIN TBL_INSPECT_STATS t2 ON t1.GROUP_SET_CD = t2.GROUP_SET_CD AND TBL_AGENT_INFO.AGENT_CD = t2.AGENT_CD
Where t1.NAME = N'${group_name}' AND TBL_AGENT_INFO.DEL_FLAG = 0` ;
        new sql.Request().query(query, (err, result) => {
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
};


exports.view_modify_group_IP_info = (group_name) => {
    return new Promise((resolve, reject) => {
        let query = `Select TBL_AGENT_INFO.AGENT_CD, XCCDF_CD, IP
From  (TBL_GROUP_SET_LIST inner join TBL_AGENT_INFO on TBL_GROUP_SET_LIST.AGENT_CD = TBL_AGENT_INFO.AGENT_CD) 
inner join TBL_GROUP_INFO On TBL_GROUP_INFO.GROUP_SET_CD = TBL_GROUP_SET_LIST.GROUP_SET_CD
Where TBL_GROUP_INFO.NAME = N'${group_name}' AND TBL_AGENT_INFO.DEL_FLAG = 0` ;
        new sql.Request().query(query, (err, result) => {
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
};

exports.view_modify_agent_os_info = (group_set_cd,agent_cd) => {
    return new Promise((resolve, reject) => {
        let query = `Select TBL_GROUP_SET_LIST.* ,TBL_AGENT_INFO.OS
From  TBL_GROUP_SET_LIST 
inner join TBL_AGENT_INFO on TBL_GROUP_SET_LIST.AGENT_CD = TBL_AGENT_INFO.AGENT_CD 
Where TBL_GROUP_SET_LIST.GROUP_SET_CD = N'${group_set_cd}' AND TBL_AGENT_INFO.DEL_FLAG = 0 AND TBL_AGENT_INFO.AGENT_CD != ${agent_cd}` ;
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
};

exports.find_agent = (ip) =>{
    return new Promise((resolve, reject) => {
        let query = `Select AGENT_CD From TBL_AGENT_INFO WHERE IP = '${ip}' AND DEL_FLAG = 0`;
        new sql.Request().query(query, (err, result) => {
            if(err){
                reject(err);
            }
            resolve(result);
        })
    })
}

exports.get_data_for_xccdf_apply = (group_set_cd, os) =>{
    return new Promise((resolve, reject) => {
        let query = `Select TBL_GROUP_SET_LIST.AGENT_CD
From  TBL_GROUP_SET_LIST 
inner join TBL_AGENT_INFO on TBL_GROUP_SET_LIST.AGENT_CD = TBL_AGENT_INFO.AGENT_CD 
Where TBL_GROUP_SET_LIST.GROUP_SET_CD = N'${group_set_cd}' AND TBL_AGENT_INFO.DEL_FLAG = 0 AND TBL_AGENT_INFO.OS = N'${os}'`;
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
};

exports.view_xccdf_included_group = (group_name) => {
    return new Promise((resolve, reject) => {
        let query=`Select DISTINCT TBL_AGENT_INFO.OS, TBL_GROUP_SET_LIST.XCCDF_CD, TBL_XCCDF.FILE_NAME, TBL_XCCDF.FILE_PATH
From  TBL_GROUP_SET_LIST 
inner join TBL_AGENT_INFO on TBL_GROUP_SET_LIST.AGENT_CD = TBL_AGENT_INFO.AGENT_CD
inner join TBL_GROUP_INFO On TBL_GROUP_INFO.GROUP_SET_CD = TBL_GROUP_SET_LIST.GROUP_SET_CD
left join TBL_XCCDF on TBL_GROUP_SET_LIST.XCCDF_CD = TBL_XCCDF.XCCDF_CD
WHERE TBL_GROUP_INFO.NAME = N'${group_name}' AND TBL_AGENT_INFO.DEL_FLAG = 0 ` ;
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if(err){
                reject(err);
            }
            resolve(result);
        })
    })
};
exports.view_xccdf_items = (xccdf_cd) =>{
    return new Promise((resolve, reject)=>{
        let query = `SELECT DISTINCT * FROM TBL_XCCDF_ITEM WHERE XCCDF_CD = ${xccdf_cd}`;
        console.log(query);
        new sql.Request().query(query, (err,result)=>{
            if (err)
                reject(err);
            resolve(result);
        });
    });
}

exports.update_xccdf_cd = (group_set_cd, agent_cd, xccdf_cd) =>{
    return new Promise((resolve, reject) =>{
        let query = `UPDATE TBL_GROUP_SET_LIST SET XCCDF_CD = ${xccdf_cd}
        WHERE GROUP_SET_CD = ${group_set_cd} AND AGENT_CD = ${agent_cd}`;
        console.log(query);
        new sql.Request().query(query, (err, result) =>{
            if(err){
                reject(err);
            }
            resolve(result);
        })
    });
};

exports.delete_agent_from_group_set_list = (group_set_cd, agent_cd) => {
    return new Promise((resolve, reject) =>{
        let query = `DELETE FROM TBL_GROUP_SET_LIST WHERE GROUP_SET_CD = ${group_set_cd} AND AGENT_CD = ${agent_cd}`;
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
};

exports.report_inspect_stats = (group_set_cd, agent_cd, cnt)=>{
    return new Promise((resolve, reject) => {
        let query = `insert TBL_INSPECT_STATS (GROUP_SET_CD, AGENT_CD, ITEM_CNT) values(${group_set_cd}, ${agent_cd}, ${cnt})`;
        new sql.Request().query(query, (err, result) => {
            if(err){
                reject(err);
            }
            resolve(result);
        })
    });
};

exports.get_inspect_cd = () => {
    return new Promise((resolve, reject) => {
        let query = `SELECT MAX(INSPECT_CD) as max_INSPECT_CD FROM TBL_INSPECT_STATS`;
        new sql.Request().query(query, (err, result) =>{
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
};

exports.insert_servey = (inspect_cd, agent_cd, a0,a1,a2,a3,a4,a5,a6,a7,a8)=>{
    return new Promise((resolve,reject)=>{
        new sql.Request().query('insert TBL_INSPECT_SURVEY (INSPECT_CD, AGENT_CD, INSPECT_ITEM_CD, INSPECT_RESULT) values('+ inspect_cd +',' + agent_cd +',\'1\', \''+ a0 + '\'),(\'2\',\''+ a1 + '\'),(\'3\',\''+ a2 + '\'),(\'4\',\''+ a3 + '\'),(\'5\',\''+ a4 + '\'),(\'6\',\''+ a5 + '\'),(\'7\',\''+ a6 + '\'),(\'4\',\''+ a7 + '\'),(\'9\',\''+ a8 + '\')',(err,result)=>{    if(err){
                console.log(err);
            }else
                resolve(result);
        });
    });
};

exports.insert_result = (inspect_cd, item_code, item_result, agent_cd) => {
    return new Promise((resolve, reject) => {
        let query = `insert TBL_INSPECT_SURVEY (INSPECT_CD, AGENT_CD, INSPECT_ITEM_CD, INSPECT_RESULT) values(${inspect_cd}, ${agent_cd}, N'${item_code}', ${item_result})`;
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
};

exports.get_servey = ()=>{
    return new Promise((resolve,reject)=>{
        new sql.Request().query('select INSPECT_ITEM_CD, INSPECT_RESULT from (select top(9) * from TBL_INSPECT_SURVEY order by inspect_date desc) as a order by inspect_cd asc',(err,result)=>{
            if(err){
                console.log(err);
            }else
                resolve(result);
        });
    });
};

exports.get_xccdf = (ip)=>{
    return new Promise((resolve,reject)=>{
        new sql.Request().query(`select FIlE_PATH from TBL_XCCDF where XCCDF_CD = 10006`,(err,result)=> {
            if (err) {
                console.log(err);
            } else {
                resolve(result);
            }
        });
    });
};

