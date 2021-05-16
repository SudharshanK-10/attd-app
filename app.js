const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const port = process.env.PORT || 3000;
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const saltrounds = 7;


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
    const password = bcrypt.hashSync(req.body.password,saltrounds);
    const email = req.body.email;
    const college = req.body.college;

    console.log(`First name: ${first_name}, Last name: ${last_name}, Password: ${password}, Email: ${email}, college: ${college}`);
    //res.send('request received!');

    const obj  = {
   'first_name'  : first_name,
   'last_name'	 : last_name,
   'password'    : password,
   'email'  : email,
   'college'  : college
   };

    const text = 'INSERT INTO faculty(first_name, last_name, password, email, college) VALUES($1, $2, $3, $4, $5) RETURNING *';
    const values = [first_name, last_name, password, email, college];

    //res.send(JSON.stringify(obj));
    try {
      const client = await pool.connect();
      const result = await client.query(text,values);
      const faculty = result.rows;
      res.send("Successfully signed up, Welcome!, " +first_name+" "+last_name+", Your faculty id : "+faculty[0].faculty_id);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
});

//successful login
app.post('/logged', async(req, res) => {
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
    try {
      var client = await pool.connect();
      var result = await client.query(text,values);
      //var faculty = { 'faculty': (result) ? result.rows : null};
      faculty = result.rows;

      email = faculty[0].email;
      password = faculty[0].password;

      //decrypt the Password
      const ok = bcrypt.compareSync(given.password,password);

      if(email==given.email && ok){
           res.render('logged',{given: faculty});
      }
      else {
           res.send("Invalid Email-id or Password!")
      }
      client.release();

    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
});



//app.listen(port, () => console.log(`listening on port ${port}!`));
