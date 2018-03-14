var express = require('express');
var cors = require('cors');
const jwt = require("jsonwebtoken") // install jwt webtoken "npm install jsonwebtoken"
var fs = require("fs");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();


const JWT_API_SECERET = "MY_API_SECRETE";
app.use(cors());
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cookieParser());

app.get('/', function(req, res) {
    res.send('Welcoming to the student api! true')
});

app.post('/login', function(req, res) {
    var userInfo = [];
    var foundUser = false;
    var postParams = req.body;
    fs.readFile( __dirname + "/users.json", 'utf8', function (err, data) {
        var users = JSON.parse( data );
        var totalUsers = Object.keys(users).length;
        for (var index in users) {
            if (users[index].username == postParams.username && users[index].password == postParams.password) {
                userInfo = users[index];
                foundUser = true;
                break;
            }
        }
        if (foundUser)
         res.json({ token: jwt.sign({ username: userInfo.username, fullnameName: userInfo.name, _id: userInfo.id}, JWT_API_SECERET), 
                    userInfo: userInfo });
        else
            res.status(401)
               .send('null');
    });
})

/* created a middleware function for AUTH 
*  insert this function for auth based routes 
*/
function verifyToken(req, res, next) {
    // in post man set the header with key "x-access-token" value "token got in login api"
    var token = req.headers['x-access-token'];
    if (!token)
      return res.status(403).send({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token,JWT_API_SECERET , function(err, decoded) {    
        if (err)
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
      
        // if everything good, save to request for use in other routes
        req.userId = decoded.id; // append the user id in the request for the futute use case 
        req.user = decoded; // append the user data in the request for the futute use case 

        next();
    });
  }

// check the current user 
app.get('/me', verifyToken , function(req, res) {     
    res.status(200)
       .send(req.user); 
});

  // inserted the midelware verifyToken
app.get('/users', function (req, res) {
    fs.readFile( __dirname + "/users.json", 'utf8', function (err, data) {
        res.status(200).json(JSON.parse(data));
    });
})

app.get('/user/:id', function (req, res) {
    fs.readFile( __dirname + "/users.json", 'utf8', function (err, data) {
        var users = JSON.parse( data );
        var unique = "user" + req.params.id;
        if (users[unique]) {
            var user = users[unique]
            res.status(200)
               .send(JSON.stringify(user));
        } else {
            res.status(404)
               .send('null');
        }
    });
})

app.delete('/user/:id', function (req, res) {
    var jsonFile = __dirname + "/users.json"
    fs.readFile( jsonFile, 'utf8', function (err, data) {
        var users = JSON.parse( data );
        var unique = "user" + req.params.id;
        if (users[unique]) {
            delete users[unique];
            fs.writeFile(jsonFile, JSON.stringify(users), function (writeError) {
                if (writeError) {
                    res.status(403)
                       .send('null');
                } else {
                    res.status(200)
                       .send(JSON.stringify({success: "User deleted!"}));
                }
            });
        } else {
            res.status(404)
               .send(JSON.stringify({success: "User doesn't exists!"}));
        }
    });
})

app.post('/user/add', function (req, res) {
    var postParams = req.body;
    var jsonFile = __dirname + "/users.json"
    fs.readFile( jsonFile, 'utf8', function (err, data) {
        var users = JSON.parse( data );
        var totalUsers = Object.keys(users).length;
        var maxId = totalUsers;
        for (var index in users)
            maxId = (maxId < users[index].id) ? users[index].id : maxId;
        var newUserId = maxId + 1;
        postParams.id = newUserId;
        users['user'+ newUserId] = postParams;
        fs.writeFile(jsonFile, JSON.stringify(users), function (writeError) {
            if (writeError) {
                res.status(403)
                   .send('null');
            } else {
                res.status(201)
                   .send('User created!');
            }
        });
    });
    
})

app.get('*', function(req, res) {
    res.send("Not found!");
});

app.post('/logout', function(req, res) {
    
})

var server = app.listen(8090, function() {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
});