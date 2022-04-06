//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const md5 = require("md5");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/SecretDB", {useUnifiedTopology: true});

// User Database
const userSchema = new mongoose.Schema({
  email : String,
  password : String
});

const User = new mongoose.model("User", userSchema);

// Secret Database
const secretSchema = new mongoose.Schema({
  secret : String
});
const Secret = new mongoose.model("Secret", secretSchema);

// Home Webpage
app.get("/", function(req,res){
  res.render("home");
});

// Login Webpage
app.route("/login")
.get(function(req,res){
  res.render("login");
})
.post(function(req, res){
  User.findOne({email : req.body.username}, function(err, foundOne){
    if(!err){
      if(foundOne){
        if(foundOne.password === md5(req.body.password)){
          res.redirect("secrets");
        }else{
          res.send("Wrong password");
        }
      }else{
        res.send("User doesnt find");
      }
    }else{
      console.log(err);
    }
  });
});

// Register Webpage
app.route("/register")
.get(function(req, res){
  res.render("register");
})
.post(function(req, res){
  const newUser = new User({
    email : req.body.username,
    password : md5(req.body.password)
  });
  newUser.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.redirect("secrets");
    }
  });
});

// Logout button to the home webpage
app.get("/logout",function(req, res){
  res.redirect("/");
});

// Secret Webpage
app.get("/secrets", function(req, res){
  Secret.find(function(err, found){
    res.render('secrets', {secrets : found});
  });
});


// Submit button to the submit webpage
app.route("/submit")
.get(function(req, res){
  res.render("submit");
})
.post(function(req, res){
  const newSecret = new Secret({
    secret : req.body.secret
  });
  newSecret.save(function(err){
    if(err) console.log(err);
  });
  res.redirect("/secrets");
})

// Listen Port 3000
app.listen(3000, function(){
  console.log("Server started on port 3000");
});
