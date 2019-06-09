const express = require('express');
const router = express.Router();
const DB = require('../../db');
const multer = require('multer');
const path = require("path");

let storage = multer.diskStorage({
  destination: function(req, file ,callback){
    callback(null, "upload/")
  },
  filename: function(req, file, callback){
    let extension = path.extname(file.originalname);
    let basename = path.basename(file.originalname, extension);
    callback(null, basename + "-" + Date.now() + extension);
  }
});


let upload = multer({
  storage: storage
});

router.get('/', function (req, res, next) {
  res.render('./main/Policy/oval');
});// 기존 그룹페이지

router.post('/', upload.single('imgFile'), (req, res, next) => {

  let file = req.file;
  let result = {
    originalName : file.originalName,
    size: file.size
  };

  res.render('./main/Policy/oval');
});


module.exports = router;