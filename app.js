//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")

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

const secret = "Loremipsumdolor";
loginSchema.plugin(encrypt, {secret: secret, encryptedFields:["password"]});

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
        var password = req.body.password;
        console.log(password);
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
                if(result.password === password) {
                    res.render("secrets.ejs");
                }
            }

        })
    });

app.route("/register")
    .get(function(req,res) {
        res.render("register.ejs");
    })
    .post(function(req,res) {
        
        const user = new User({
            username : req.body.username,
            password : req.body.password
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


app.listen(3000, function() {
    console.log("Server started on port 3000");
});
