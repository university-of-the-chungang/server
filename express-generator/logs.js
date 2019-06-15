/* eslint-disable no-undef */
let xlsx = require("xlsx");
let fs = require("fs");
let DB = require('./db');
let moment = require('moment');
exports.make_xlsx = (file_name, obj) => {
    let data = new Array(obj)
    let file_path = __dirname + '\\public\\logs\\' + file_name + '.xlsx';
    try {
        if (fs.existsSync(file_path)) {
            let workBook = xlsx.readFile(file_path);
            let first_sheet = workBook.Sheets[file_name];
            let first_data = xlsx.utils.sheet_to_json(first_sheet);
            data.forEach(_data => {
                first_data.push(_data);
            });
            let sheet = xlsx.utils.json_to_sheet(first_data);
            workBook.Sheets[file_name] = sheet;
            xlsx.writeFile(workBook, file_path);
            return first_data;
        }
    } catch (err) {
        console.log(err);
        let sheet = xlsx.utils.json_to_sheet(data);
        let workBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workBook, sheet, file_name);
        xlsx.writeFile(workBook, file_path);
        return null;
    }
};
exports.refresh_xlsx = (file_path) => {
    let workbook = xlsx.readFile(file_path);
    let first_sheet_name = workbook.SheetNames[0];
    let first_sheet = workbook.Sheets[first_sheet_name];
    let first_data = xlsx.utils.sheet_to_json(first_sheet);
    return new Promise((resolve, reject) => {
        DB.get_agent_info().then(result => {
            db_data = result['recordset'];
            db_data.forEach(db_elem => {
                first_data.forEach(elem => {
                    if (elem['IP'] == db_elem['IP']) {
                        db_elem['PURPOSE'] = elem['용도'];
                        db_elem['OWNER'] = elem['소유자'];
                        DB.update_agent_info(db_elem.AGENT_CD, db_elem.IP, db_elem.MAC_ADDR, db_elem.OS, db_elem.PURPOSE, db_elem.OWNER, db_elem.DESCRIPTION, db_elem.STATE);
                    }
                })
            });
        }).then(() => {
            resolve(true);
        });

    });
}
exports.read_xlsx = (file_path) => {
    let workbook = xlsx.readFile(file_path);
    let first_sheet_name = workbook.SheetNames[0];
    let first_sheet = workbook.Sheets[first_sheet_name];
    let first_data = xlsx.utils.sheet_to_json(first_sheet);

    return new Promise((resolve, reject) => {
        first_data.forEach(elem => {
            console.log(elem['IP']);
            console.log(elem['용도']);
            console.log(elem['소유자']);
            DB.add_agent_info_from_xlsx(elem['IP'], elem['용도'], elem['소유자']).then(result => {
                console.log(result);
            }).catch(err => {
                console.log(err);
            });
        });
        resolve(true);
    }


    )
};

exports.make_log = (log_type,sess_name,act)=>{
    let now =  moment().format('YYYY-MM-DD HH:mm:ss');
    DB.add_log(log_type,`${sess_name} 가 ${act}을(를) 하였음`, now);
};