const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const port = process.env.PORT || 3000;
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const saltrounds = 10;
//const cors = require('cors');
//const multer = require('multer');
//const helpers = require('./helpers'); //identify the csv files
const fileUpload = require('express-fileupload');
const csvtojson = require('csvtojson');
//const morgan = require('morgan');
//const _ = require('lodash');
//var formidable = require('formidable');
//const fs = require('fs');

// for parsing application/xwww-
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
//app.use(express.static(__dirname + '/logged'));
app.use(fileUpload());
/*app.use(fileUpload({
    createParentPath: true
}));
*/
//app.use(morgan('dev'));
//app.use(cors());

app.listen(port, () => console.log(`listening on port ${port}!`));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

//displaying the database
app.get('/db', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM faculty');
      const faculty = { 'faculty': (result) ? result.rows : null};
      res.render('db',faculty);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  });

//initial register page
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});


//login page
app.get('/login.html',function(req,res) {
	res.sendFile(path.join(__dirname + '/login.html'));
});


// for parsing application/xwww-
//app.use(bodyParser.json());
//app.use(express.urlencoded({ extended: true }));

//success register page
app.post('/faculty', async(req, res) => {
    const name = req.body.name;
    const password = bcrypt.hashSync(req.body.password,saltrounds);
    const email = req.body.email;
    const college = req.body.college;

    console.log(`Name: ${name}, Password: ${password}, Email: ${email}, college: ${college}`);
    //res.send('request received!');

    const obj  = {
   'name'  : name,
   'password'    : password,
   'email'  : email,
   'college'  : college
   };

   //looking for email
    var text = 'SELECT * FROM faculty WHERE email=$1';
    var values = [email];

    try {
     var client = await pool.connect();
     var result = await client.query(text,values);
     var faculty = result.rows;

     if(faculty[0].email==email){
          return res.render('authenticate',{given:faculty});
     }
     client.release();
     }
     catch (err) {
      console.error(err);
      res.send("Error " + err);
    }

    //if email doesn't exists
    text = 'INSERT INTO faculty(name, password, email, college) VALUES($1, $2, $3, $4) RETURNING *';
    values = [name, password, email, college];

    //res.send(JSON.stringify(obj));
    try {
      const client = await pool.connect();
      const result = await client.query(text,values);
      const faculty = result.rows;
      res.render('register',{given: faculty});
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
});

//successful login
app.post('/logged', async(req, res) => {

    try {
        var password = req.body.password;
        var email = req.body.email;

        console.log(`Email: ${email}, Password: ${password}`);
        //res.send('request received!');

        const given  = {
       'email' : email,
       'password'    : password
       };

        var text = 'SELECT * FROM faculty WHERE email=$1';
        var values = [email];

        //res.send(JSON.stringify(obj));
      var client = await pool.connect();
      var result = await client.query(text,values);
      const faculty = result.rows;

      email = faculty[0].email;
      password = faculty[0].password;

      //decrypt the Password
      const ok = bcrypt.compareSync(given.password,password);

      if(email==given.email && ok){
           res.render('logged',{given: faculty});
      }
      else {
           res.send("<b>Invalid Email-id or Password!<b>")
      }

      client.release();

    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
});

//uploading csv files
app.post('/logged/upload_csv',function(req,res){
     res.render('upload-csv');
});

/*
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null,__dirname);
    },

    // By default, multer removes file extensions so let's add them back
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
*/
let csvdata = "text";

app.post('/logged/uploaded_csv',(req,res) => {
     csvdata = req.files.csv_file.data.toString('utf16le');
     csvdata = csvdata.substring(csvdata.indexOf("\n") + 1);
     csvdata = csvdata.substring(csvdata.indexOf("\n") + 1);
     csvdata = csvdata.substring(csvdata.indexOf("\n") + 1);
     csvdata = csvdata.substring(csvdata.indexOf("\n") + 1);
     csvdata = csvdata.substring(csvdata.indexOf("\n") + 1);
       return csvtojson().fromString(csvdata).then(json =>
         {return res.status(201).json({json:json})})
});



//app.listen(port, () => console.log(`listening on port ${port}!`));
