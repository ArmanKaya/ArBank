const render = require("ejs")
const express = require("express")
const usersRouter = express.Router()
var jwt = require('jsonwebtoken');
const {createAccount, createUser, userExists, login, userId} = require("../models/users")



usersRouter.get("/register", (req, res) => {
  res.render("register")
});

usersRouter.get("/login", (req, res) => {
    res.render("login")
  });

// db.run("INSERT INTO users (name, password) VALUES (?, ?)", [req.body.username_login, hash])

usersRouter.post("/register", async (req, res) => {
    const { username, password } = req.body;
    console.log("user creating", username, password, await userExists(username))
    if (!username || !password || await userExists(username)) return res.status(400).redirect("/users/register")
    await createUser(username, password)
    await createAccount()
    res.redirect("/users/login")
});

usersRouter.post("/login", async (req, res) => {
    const { username, password } = req.body;

    console.log(await userExists(username))
    if (!username || !password || !(await userExists(username))) return res.status(400).redirect("/users/login")
    console.log("2")

    
    const token = await login(username, password)

    res.cookie("token", token)
    console.log(token)
    
    res.redirect("/")
});


// usersRouter.post("/login/welcome"), (req, ress) =>{
//     res.send(`Velkommen til ArBank ${}`)
// }

module.exports = usersRouter