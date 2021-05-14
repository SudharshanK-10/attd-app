const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const port = process.env.PORT || 3000;
const { Pool } = require('pg');

// for parsing application/xwww-
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => console.log(`listening on port ${port}!`));
app.set('view engine', 'ejs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// for parsing application/xwww-
//app.use(bodyParser.json());
//app.use(express.urlencoded({ extended: true }));

app.post('/faculty', function(req, res){
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
   res.send(JSON.stringify(obj));
});

//app.listen(port, () => console.log(`listening on port ${port}!`));
