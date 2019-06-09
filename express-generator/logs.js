/* eslint-disable no-undef */
let xlsx = require("xlsx");
let fs = require("fs");
exports.make_xlsx = (file_name,obj)=>{
    let data = new Array(obj)
    let file_path = __dirname+'\\public\\logs\\'+file_name+'.xlsx';
    try{
        if( fs.existsSync(file_path)){
            let workBook = xlsx.readFile(file_path);
            let first_sheet = workBook.Sheets[file_name];
            let first_data = xlsx.utils.sheet_to_json(first_sheet);
            data.forEach(_data => {
                first_data.push(_data);
            });
            let sheet = xlsx.utils.json_to_sheet(first_data);
            workBook.Sheets[file_name] = sheet;
            xlsx.writeFile(workBook,file_path);
            return first_data;
        }
    }catch(err){
        console.log(err);
        let sheet = xlsx.utils.json_to_sheet(data);
        let workBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workBook,sheet,file_name);
        xlsx.writeFile(workBook,file_path);
        return null;
    }
};