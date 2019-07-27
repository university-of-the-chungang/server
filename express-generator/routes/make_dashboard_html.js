let fs = require('fs');
exports.buildHtml = (row) => {
    return new Promise((resolve, reject) => {
        fs.readFile(__dirname + '/sample.html', 'utf-8', (err, html) => {
            console.log(row);
            if (err) {
                reject(err);
            }
            let un_obey_cnt = row['ITEM_CNT'] - row['GRD_SCORE'];
            html = html.replace(/\$\{un_obey_cnt\}/gi, un_obey_cnt);
            html = html.replace(/\$\{AGENT_IP\}/gi, row['IP']);
            html = html.replace(/\$\{AGENT_OS\}/gi, row['OS']);
            html = html.replace(/\$\{rule_no\}/gi, row['INSPECT_CD']);
            html = html.replace(/\$\{pass_cnt\}/gi, row['GRD_SCORE']);
            html = html.replace(/\$\{fail_cnt\}/gi, un_obey_cnt);
            html = html.replace(/\$\{pass_percent\}/gi, row['GRD_SCORE'] / row['ITEM_CNT'] * 100);
            html = html.replace(/\$\{fail_percent\}/gi, un_obey_cnt / row['ITEM_CNT'] * 100);



            resolve(html);
        })
    })

}


exports.make_html = (row_arr) => {
    let rows = row_arr;
    let paths = [];
    return new Promise((resolve, reject) => { 
        for (let i = 0; i < rows.length; i += 1) {
            let elem = rows[i];
            let filename = elem['CREATE_TIME'].split('T')[0] + '_' + elem['ACTIVE_TIME'].split('T')[0] + '_' + elem['GROUP_SET_CD'][0] + '_' + elem['IP'];
            let stream = fs.createWriteStream(__dirname + '/' + filename + ".html");
            stream.once('open', (fd) => {
                self.buildHtml(elem).then(html => {
                    stream.write(html);
                    stream.end();
                })
            });
            stream.on('close', () => {
                paths.push(stream.path);
                if(paths.length == rows.length){
                resolve(paths);
                }

            })
        }

    })
}

