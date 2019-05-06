const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

router.get('/dashboard', function(req, res, next) {
  res.render('dashboard' );
});

/* DB.JS TEST MAPPING */
router.get('/dbtest',(req,res,next)=>{
  res.render('test_mssql');
});

/* ****************** */

module.exports = router;
