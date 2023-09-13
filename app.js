require('dotenv').config();
const express = require("express");
const bodyparser = require('body-parser');
const ejs = require("ejs");
const mongoose = require("mongoose");
const encypt = require("mongoose-encryption");


const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({
    extended:true
}));
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true})

const userScema = new mongoose.Schema({
    email: String,
    password: String
});
// const secret = "i cant live without manya"
const secret = process.env.SECRT;
userScema.plugin(encypt,{secret:secret , encryptedFields: ["password"]});

const user = new mongoose.model("user", userScema);

app.get("/", function(req,res){
    res.render("home");
});


app.get("/login", function(req,res){
    res.render("login");
});
app.post("/login", function(req,res){
    const name = req.body.username;
    const pass = req.body.password;
    user.findOne({email: name}).then((foundusere) => {
        if(foundusere){
            if(foundusere.password===pass){
                res.render("secrets");
            }
        }
    });
});


app.get("/register", function(req,res){
    res.render("register");
});
app.post("/register", function(req,res){
    const newuser = new user({
        email: req.body.username,
        password: req.body.password
    });
    newuser.save().then(() => res.render("secrets"));
});


app.listen(3000,function(){
    console.log("server is running at port 3000");
})