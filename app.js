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
app.use(express.static('public/img'));
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

     if((typeof faculty[0] !='undefined') && faculty[0].email==email){
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

//create new class
app.post('/logged/new_class',function(req,res){
     res.render('new-class');
});

app.post('/logged/new_class_created',async(req,res) => {
     var faculty_id = req.body.faculty_id;
     var subject = req.body.subject;

     const given  = {
          'faculty_id' : faculty_id,
          'subject'    : subject
   };

     var text = 'INSERT INTO class (faculty_id,subject) VALUES ($1,$2) RETURNING *';
     var values = [faculty_id,subject];

     try {
      const client = await pool.connect();
      const result = await client.query(text,values);
      const faculty = result.rows;
      res.render('new-class-created',{given:faculty});
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }

});

//new set of students
app.get('/logged/new_class_created/new_student',function(req,res){
     res.render('new-student');
});

let studdata = "text";

app.post('/logged/new_class_created/new_student/information',async(req,res) => {
     studdata = req.files.csv_file.data.toString('utf8');
     //studdata = csvdata.substring(csvdata.indexOf("\nFull Name") + 1);

     var lines=studdata.split("\r\n");
     var result = [];
     var headers=lines[0].split(",");

     for(var i=1;i<lines.length;i++){
	  var obj = {};
	  var currentline=lines[i].split(",");

	  for(var j=0;j<headers.length;j++){
		  obj[headers[j]] = currentline[j];
	  }
	  result.push(obj);
  }
     for(const obj of result) {
          var values = [];
          if(typeof obj["email"]!='undefined'){
          Object.entries(obj).forEach(([key, value]) => {
               console.log(`${key} : ${value}`);
               values.push(value);
          });
          console.log('-------------------');

          //populate the student table
          var text = 'INSERT INTO student (rollno,name,dob,major,year,college,email) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *';

          try {
           const client = await pool.connect();
           const result = await client.query(text,values);
           const faculty = result.rows;
           console.log("success!");
           client.release();
         } catch (err) {
           console.error(err);
           res.send("Error " + err);
      }

     }
     }
     return res.render('student-detail-success');
});

//uploading csv files
app.post('/logged/upload_csv',function(req,res){
     res.render('upload-csv');
});

let csvdata = "text";

app.post('/logged/uploaded_csv',async(req,res) => {
     //validate the lec,cls and faculty id
     csvdata = req.files.csv_file.data.toString('utf16le');
     csvdata = csvdata.substring(csvdata.indexOf("\nFull Name") + 1);

     var lines=csvdata.split("\n");
     var result = [];
     var headers=lines[0].split("\t");

     for(var i=1;i<lines.length;i++){
	  var obj = {};
	  var currentline=lines[i].split("\t");

	  for(var j=0;j<headers.length;j++){
		  obj[headers[j]] = currentline[j];
	  }
	  result.push(obj);
  }
     for(const obj of result) {
          if(obj["Role"]=="Attendee"){
          Object.entries(obj).forEach(([key, value]) => {
               console.log(`${key} : ${value}`);
          });
          console.log('-------------------');
           //insert into table takes place here
      }
     }
     //return result; //JavaScript object
     return res.json(result); //JSON
});
