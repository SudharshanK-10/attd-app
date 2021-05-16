const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const port = process.env.PORT || 3000;
const { Pool } = require('pg');

// for parsing application/xwww-
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');


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
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const password = req.body.password;

    console.log(`First name: ${first_name}, Last name: ${last_name}, Password: ${password}`);
    //res.send('request received!');

    const obj  = {
   'first_name'  : first_name,
   'last_name'	 : last_name,
   'password'    : password
   };

    const text = 'INSERT INTO faculty(first_name, last_name, password) VALUES($1, $2, $3) RETURNING *';
    const values = [first_name, last_name, password];

    //res.send(JSON.stringify(obj));
    try {
      const client = await pool.connect();
      const result = await client.query(text,values);
      res.send("Successfully signed up, Welcome!, " +first_name+" "+last_name);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
});

//successful login
app.post('/logged', async(req, res) => {
    var faculty_id = parseInt(req.body.faculty_id);
    var first_name = req.body.first_name;
    var last_name = req.body.last_name;
    var password = req.body.password;

    console.log(`Faculty_id: ${faculty_id}, First name: ${first_name}, Last name: ${last_name}, Password: ${password}`);
    //res.send('request received!');

    var given  = {
   'faculty_id'  : faculty_id,
   'first_name'  : first_name,
   'last_name'   : last_name,
   'password'    : password
   };

    var text = 'SELECT * FROM faculty WHERE faculty_id=$1';
    var values = [faculty_id];

    //res.send(JSON.stringify(obj));
    try {
      var client = await pool.connect();
      var result = await client.query(text/*,values*/);
      //var faculty = { 'faculty': (result) ? result.rows : null};
      var faculty = result;
      //res.send(faculty_id+" "+faculty.first_name+" "+faculty.last_name+" "+faculty.password+" ");
      //res.send(faculty);

      if(faulty[0].first_name==give.first_name&&faulty[0].last_name==give.last_name&&faulty[0].password==give.password){
           res.render(logged,given);
      }
      else {
           res.send("Invalid name or Password!")
      }
      client.release();

    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
});



//app.listen(port, () => console.log(`listening on port ${port}!`));
