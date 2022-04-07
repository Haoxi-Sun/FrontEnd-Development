//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret : "Our little secret.",
  resave : false,
  saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/SecretDB", {useUnifiedTopology: true});

// User Database
const userSchema = new mongoose.Schema({
  email : String,
  password : String,
  googleId : String,
  secret : [String]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Home Webpage
app.get("/", function(req,res){
  res.render("home");
});

// Google Strategy
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

// Login Webpage
app.route("/login")
.get(function(req,res){
  res.render("login");
})
.post(function(req, res){
  const user = new User({
    username : req.body.username,
    password : req.body.password
  });
  req.login(user, function(err){
    if(err){
      console.log(err);
      res.redirect("/login");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
  // User.findOne({email : req.body.username}, function(err, foundOne){
  //   if(err){
  //     console.log(err);
  //   }else{
  //     if(foundOne){
  //       bcrypt.compare(req.body.password, foundOne.password, function(err, result){
  //         if(result === true) res.redirect("secrets");
  //       });
  //     }
  //   }
  // });
});


// Register Webpage
app.route("/register")
.get(function(req, res){
  res.render("register");
})
.post(function(req, res){
  User.register({username : req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
  // bcrypt.hash(req.body.password, saltRounds, function(err, hash){
  //   const newUser = new User({
  //     email : req.body.username,
  //     password : hash
  //   });
  //   newUser.save(function(err){
  //     if(err){
  //       console.log(err);
  //     }else{
  //       res.redirect("secrets");
  //     }
  //   });
  // });
});

// Logout button to the home webpage
app.get("/logout",function(req, res){
  req.logout();
  res.redirect("/");
});

// Secret Webpage
app.get("/secrets", function(req, res){
  if(req.isAuthenticated()){
    User.find({"secret" : {$ne: null}}, function(err, found){
      if(err){
        console.log(err);
      }else{
        if(found){
          res.render('secrets', {secrets : found});
        }
      }
    });
  }else{
    res.redirect("/");
  }
});


// Submit button to the submit webpage
app.route("/submit")
.get(function(req, res){
  res.render("submit");
})
.post(function(req, res){
  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.secret.push(req.body.secret);
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});

// Listen Port 3000
app.listen(3000, function(){
  console.log("Server started on port 3000");
});
