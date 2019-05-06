var sql = require('mssql');

// DB 정보 


let config = {
        "user": "test", //default is sa
        "password": "test",
        "server": "localhost", // for local machine
        "database": "nsrang", // name of database
        "options": {
            "encrypt": true
        }
      }

sql.connect(config, err => { 
    if(err){
        throw err ;
    }
    console.log("Connection Successful !");

    new sql.Request().query('select 1 as number', (err, result) => {
        console.dir(result)
    })
        
});

sql.on('error', err => {
    // ... error handler 
    console.log("Sql database connection error " ,err);
})