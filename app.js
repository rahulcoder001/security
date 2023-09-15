require('dotenv').config();
const express = require("express");
const bodyparser = require('body-parser');
const ejs = require("ejs");
const mongoose = require("mongoose");
// const md5 = require("md5");
// const encypt = require("mongoose-encryption");
const bcrypt = require("bcrypt");
const saltround = 10;
const session = require("express-session");
const passport = require("passport");
const passportlocalmongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({
    extended:true
}));
app.use(session({
    secret: "ilovemanya",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true})

const userScema = new mongoose.Schema({
    email: String,
    password: String
});
userScema.plugin(passportlocalmongoose);
userScema.plugin(findOrCreate);
// const secret = "i cant live without manya"
// const secret = process.env.SECRT;
// userScema.plugin(encypt,{secret:secret , encryptedFields: ["password"]});

const user = new mongoose.model("user", userScema);
passport.use(user.createStrategy());
passport.serializeUser(function(user , done){
    done(null,user.id);
});
passport.deserializeUser(function(id,done){
    user.findById(id).then((user) =>{
        done(err,user);
    });
});
// passport.serializeUser(user.serializeUser());
// passport.deserializeUser(user.deserializeUser());
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRT,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    user.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get("/", function(req,res){
    res.render("home");
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function(req,res){
    res.render("login");
});
app.post("/login", function(req,res){
    // const name = req.body.username;
    // const pass = req.body.password;
    // user.findOne({email: name}).then((foundusere) => {
    //     if(foundusere){
    //         bcrypt.compare(pass, foundusere.password, function(err, result) {
    //             if(result=== true){
    //                 res.render("secrets");
    //             }
    //         });
    //     }
    // });
    const User = new user({
        username: req.body.username,
        password: req.body.password
    });
    req.logIn(User , function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            })
        }
    })
});

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){

        res.render("secrets");
    }
    else{
        res.redirect("/login")
    }
});
app.get("/register", function(req,res){
    res.render("register");
});
app.post("/register", function(req,res){
    // bcrypt.hash(req.body.password, saltround, function(err, hash) {
    //     const newuser = new user({
    //         email: req.body.username,
    //         password: hash
    //     });
    //     newuser.save().then(() => res.render("secrets"));
    // });
    // const newuser = new user({
    //     email: req.body.username,
    //     password: md5(req.body.password)
    // });
    // newuser.save().then(() => res.render("secrets"));
    user.register({username: req.body.username}, req.body.password, function(err,User){
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            })
        }
    })
});
app.get("/logout", function(req,res){
    req.logout( function(err){
        if(err){
            console.log(err);
        }
    });
    res.redirect("/");
})

app.listen(3000,function(){
    console.log("server is running at port 3000");
})