const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT || 3000;

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// for parsing application/xwww-
app.use(express.urlencoded({ extended: true }));

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

app.listen(port, () => console.log(`listening on port ${port}!`));
