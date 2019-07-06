/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
let sql = require('mssql');

// DB 정보 


let config = {
    // 해당 설정 부분은 설정파일 생기면 그리 옮길것 
    "user": "developer", //default is sa
    "password": "ang0511",
    "server": "52.231.155.141", // for local machine
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

let query_select = (data, table_name) => {
    return new Promise((resolve, reject) => {
        new sql.Request().query(`SELECT ` + String(data) + ` FROM ` + table_name, (err, result) => {
            if (result) {
                resolve(result);
            } else {
                reject(err);
            }
        });
    });

};
exports.add_log = (log_type,contents,date)=>{
    return new Promise((resolve,reject)=>{
        console.log(`INSERT INTO TBL_LOG(LOG_TYPE,CONTENTS,CONTENT_DATE) VALUES('${log_type}','${contents}',CONVERT(DATETIME,'${date}'))`);
        new sql.Request().query(`INSERT INTO TBL_LOG(LOG_TYPE,CONTENTS,CONTENT_DATE) VALUES('${log_type}','${contents}',CONVERT(DATETIME,'${date}'))`,(err,result)=>{
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
exports.get_inspect_stats = (group_set_cd) => {
    // group_set_cd를 가진 점검 결과를 검색
    return new Promise((resolve, reject) => {
        new sql.Request().query(`SELECT * FROM TBL_INSPECT_STATS WHERE GROUP_SET_CD = '` + group_set_cd + "'", (err, result) => {
            if (err) {
                reject(err);
            }
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

exports.search_log_info = (keyword2 = "") => {
    let search_key = `LIKE '%${keyword2}%'`;
    let query = `SELECT * FROM TBL_LOG WHERE ( LOG_ID ${search_key} OR LOG_TYPE ${search_key} OR CONTENTS ${search_key} )`;
    return new Promise((resolve, reject) => {
        new sql.Request().query(query, (err, result) => {
            if (err)
                reject(err);
            console.log(query);
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

exports.get_group_info = (group_name = null) => {
    // 그룹 정보 조회
    return new Promise((resolve, reject) => {
        sql_adder = "";
        if (group_name) {
            sql_adder = "WHERE NAME LIKE '" + group_name + "%'";
        }
        new sql.Request().query(`SELECT * FROM TBL_GROUP_INFO ` + sql_adder, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}


exports.total_group_info = () =>{
    return new Promise((resolve,reject)=>{
        let query = `SELECT * FROM TBL_GROUP_INFO WHERE DEL_FLAG = 0`;
        //GROUP_SET_CD, NAME, CREATE_TIME, ACTIVE_TIME, AGENT_COUNTING, INSPECTION_PERIOD, ACTIVE_STATE, DISCRIPTION
        console.log(query);
        new sql.Request().query(query,(err,result)=>{
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
}

exports.update_group_info = (cd, name, ctime, atime, counting, period, active_state, discription, del_flag) => {
    return new Promise((resolve, reject) => {
        let query = `UPDATE TBL_AGENT_INFO SET GROUP_SET_CD='${cd}', NAME = N'${name}', CREATE_TIME = '${ctime}', ACTIVE_TIME = '${atime}', AGENT_COUNTING = '${counting}', INSPECTION_PERIOD = ${period}, ACTIVE_STATE = ${'active_state'}, DISCRIPTION = N'${discription}', DEL_FLAG = '${del_flag}' WHERE GROUP_SET_CD = '${cd}'`;
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
};


exports.get_group_set_cd = (group_name = null) => {}
    let view_admin = (column_name) => {
    return new Promise((resolve, reject) => {
        query_select(column_name, "TBL_ADMIN_INFO").then((result) => {
            console.log(result);
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
        let query = `UPDATE TBL_GROUP_INFO SET DEL_FLAG = 1 WHERE GROUP_SET_CD = ` + group_set_cd;
        console.log(query);
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
        let query = `INSERT INTO TBL_XCCDF (XCCDF_CD, FILE_NAME, FILE_PATH, INSPECT_OS) VALUES (` + xccdf_cd + `, '` + file_name + `', '` + file_path + `', '` + inspect_os + `')`;
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
        arr.push(`N'` + data.division + `'`);
        arr.push(`N'` + data.position + `'`);
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
        VALUES (N'`+ name + `', CONVERT(CHAR(19), '` + create_time + `', 20), CONVERT(CHAR(19), '` + active_time + `',20), ` + agent_counting + `, 'A',  CONVERT(CHAR(19),'` + inspection_period + `', 20), 0, '` + DESCRIPTION + `')`;

        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });

};
exports.add_agent_info = (ip, mac, os, purpose, owner, desc, state) => {
    return new Promise((resolve, reject) => {
        let query = `INSERT INTO TBL_AGENT_INFO (IP, MAC_ADDR, OS, PURPOSE, OWNER, DEL_FLAG, DESCRIPTION, STATE ) VALUES('` + ip + `', '` + mac + `', '` + os + `', N'` + purpose + `', N'` + owner + `', 0, N'` + desc + `', '` + state + `')`;
        new sql.Request().query(query, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
};
exports.add_agent_info_from_xlsx = (ip,purpose,owner)=>{
    return new Promise((resolve,reject)=>{
        let query = `INSERT INTO TBL_AGENT_INFO (IP, PURPOSE, OWNER) VALUES( '${ip}', N'${purpose}', N'${owner}')`;
        console.log(query);
        new sql.Request().query(query,(err,result)=>{
            resolve(result);
        });
    });
};

exports.update_agent_info = (cd, ip, mac, os, purpose, owner, desc, state) => {
    return new Promise((resolve, reject) => {
        let query = `UPDATE TBL_AGENT_INFO SET IP='${ip}', MAC_ADDR = '${mac}', OS = '${os}', PURPOSE = N'${purpose}', OWNER = N'${owner}', DEL_FLAG = 0, DESCRIPTION = N'${desc}', STATE = '${state}' WHERE AGENT_CD = '${cd}'`;
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if (err) {
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
};

exports.view_modify_group_info = (group_name) => {
    return new Promise((resolve, reject) => {
        let query = `Select TBL_AGENT_INFO.IP
From  (TBL_GROUP_SET_LIST inner join TBL_AGENT_INFO on TBL_GROUP_SET_LIST.AGENT_CD = TBL_AGENT_INFO.AGENT_CD) 
inner join TBL_GROUP_INFO On TBL_GROUP_INFO.GROUP_SET_CD = TBL_GROUP_SET_LIST.GROUP_SET_CD
Where TBL_GROUP_INFO.NAME LIKE '${group_name}%'` ;
        console.log(query);
        new sql.Request().query(query, (err, result) => {
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
};
