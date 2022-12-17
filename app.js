//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption")
// var md5 = require('md5');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

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

// loginSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:["password"]});

const User = new mongoose.model("User",loginSchema);

app.get("/", function(req,res) {
    res.render("home.ejs");
});

app.route("/login")
    .get(function(req,res) {
        res.render("login.ejs");
    })
    .post(function(req,res) {
        var username = req.body.username;
        var password = (req.body.password);

        // User.findOne({$and: [{username:username},{password:password}]},function(err,result) {
        //     if(result === null) {
        //         res.send("error");
        //     } else {
        //         res.render("secrets.ejs");
        //     }
        // });

        User.findOne({username:username},function(err,result) {
            if(err) {
                console.log("error");
            } else {

                bcrypt.compare(password, result.password).then(function(element) {
                    if(element===true) {
                        res.render("secrets.ejs");
                    }
                });
            }
        });
    });

app.route("/register")
    .get(function(req,res) {
        res.render("register.ejs");
    })
    .post(function(req,res) {
        
        bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
            
            const user = new User({
                username : req.body.username,
                password : hash
            });
    
            user.save(function(err) {
                if(err) {
                    console.log(err);
                    res.send("error");
                } else {
                    console.log("success");
                    res.render("secrets.ejs");
                }
            });
        });

    });


app.listen(3000, function() {
    console.log("Server started on port 3000");
});
