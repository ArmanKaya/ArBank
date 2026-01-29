const render = require("ejs")
const express = require("express")
const usersRouter = express.Router()
const sqlite = require("sqlite3")
const db = new sqlite.Database("database.db")
var jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt")

db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT)")

usersRouter.get("/login", (req, res) => {
  res.render("login")
});


usersRouter.post("/login", (req, res) => {
    bcrypt.hash(req.body.password_login, 10, (err, hash) => {
        db.run("INSERT INTO users (name, password) VALUES (?, ?)", [req.body.username_login, hash])
    })
    res.redirect("/") 
});

// usersRouter.post("/login/welcome"), (req, res) =>{
//     res.send(`Velkommen til ArBank ${}`)
// }

module.exports = usersRouter