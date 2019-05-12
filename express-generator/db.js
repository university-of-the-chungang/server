/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
let sql = require('mssql');

// DB 정보 


let config = {
    // 해당 설정 부분은 설정파일 생기면 그리 옮길것 
    "user": "developer", //default is sa
    "password": "ang0511",
    "server": "localhost", // for local machine
    "database": "nsrang", // name of database
    "options": {
        "encrypt": true
    }
};
let table_list = [];
connect(config, err => {
    if (err) {
        throw err;
    }
    console.log("Connection Successful !");

    new Request().query("select name from sysobjects where type='U' ", (err, result) => {
        if (err) {
            console.log("Tables Loading Failed .");
        } else {
            // console.dir(result['recordsets'])
            result['recordsets'][0].some((record) => {
                if (record.name !== "sysdiagrams") {
                    table_list.push(record.name);
                }
            });
            console.log(String(table_list.length)+" Tables Loading Successed .");
            // view_admin("*")
        }
    });

});

on('error', err => {
    // ... error handler 
    console.log("Sql database connection error ", err);
})

let query_select = (data, table_name) => {
    return new Promise((resolve, reject) => {
        new Request().query(`SELECT ` + String(data) + ` FROM ` + table_name, (err, result) => {
            if (result) {
                resolve(result);
            } else {
                reject(err);
            }
        });
    });

};

exports.login_admin = (login_name, login_pw)=> {
    return new Promise((resolve, reject) => {
        if (login_name == null || login_pw == null || login_name.length <= 0 || login_pw.length <= 0) {
            reject("Do not submit Blank.");
        }
        else {
            new Request().query(`SELECT COUNT(ID) AS login_result FROM TBL_ADMIN_INFO WHERE NAME = '` + login_name + `' AND PASSWD = '` + login_pw + `'`, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.recordsets[0][0].login_result);
                }
            });
        }
    });
}


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

let add_admin = (data) => {
    return new Promise((resolve, reject) => {
        let query = `INSERT INTO TBL_ADMIN_INFO (NAME, PASSWD, TEL_NO, EMAIL, DIVISION, POSITION, LOCK_STAT, FROM_DATE, TO_DATE, ROLE_CD, LOCK_COUNT, LOCK_DATE, LAST_LOGIN) VALUES(`;
        let arr = [];
        arr.push(`'` + data.name + `'`);
        arr.push(`'` + data.passwd + `'`);
        arr.push(`'` + data.tel_no + `'`);
        arr.push(`'` + data.email + `'`);
        arr.push(`'` + data.division + `'`);
        arr.push(`'` + data.position + `'`);
        arr.push(data.lock_stat);
        arr.push(`'` + data.from_date + `'`);
        arr.push(`'` + data.to_date + `'`);
        arr.push(data.role_cd);
        arr.push(data.lock_count);
        arr.push(`'` + data.lock_date + `'`);
        arr.push(`'` + data.last_login + `'`);
        query += arr.join(", ");
        query += `)`
        console.log(query);
        new Request().query(query, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        })
    });

};
