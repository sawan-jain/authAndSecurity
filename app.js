//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// important ot place session here

app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.set('strictQuery', false);
mongoose.connect("mongodb://localhost:27017/secretsDB");

const loginSchema = new mongoose.Schema ({
    username:{
        type:String,
        // required:[true,"not allowed"]
    },
    password: {
        type:String,
        // required:[true,"not allowed"]
    },
    googleId:String
});

loginSchema.plugin(passportLocalMongoose);
loginSchema.plugin(findOrCreate)
const User = new mongoose.model("User",loginSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.displayName });
    });
});
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req,res) {
    res.render("home.ejs");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets", 
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});

app.route("/login")
    .get(function(req,res) {
        res.render("login.ejs");
    })
    .post(function(req,res) {
        const user = new User({
            username:req.body.username,
            password: req.body.password
        });

        req.login(user,function(err) {
            if(err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req,res,function(){
                    res.redirect("/secrets");
                });
            }
        })

    });

app.get("/secrets",function(req,res) {
    if(req.isAuthenticated()) {
        res.render("secrets.ejs");
    } else {
        res.redirect("/login");
    }
})

app.route("/register")
    .get(function(req,res) {
        res.render("register.ejs");
    })
    .post(function(req,res) {
        User.register({username:req.body.username, active: false}, req.body.password, function(err, user){
            if(err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req,res,function(){
                    res.redirect("/secrets");
                });
            }
        });
    });

app.get("/logout", function(req,res) {
    req.logout(function(err) {
        if(err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});
