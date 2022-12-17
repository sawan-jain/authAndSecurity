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
    }
});

loginSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User",loginSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());   // to generate cookie
passport.deserializeUser(User.deserializeUser());   // to destroy cookie and give data 

app.get("/", function(req,res) {
    res.render("home.ejs");
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
})
app.listen(3000, function() {
    console.log("Server started on port 3000");
});
