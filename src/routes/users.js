const render = require("ejs")
const express = require("express")
const usersRouter = express.Router()
var jwt = require('jsonwebtoken');
const { createUser, userExists, login} = require("../models/users")
const {createAccount, getBalance} = require("../models/accounts")
const sqlite = require("sqlite3")
const db = sqlite


usersRouter.get("/register", (req, res) => {
  res.render("register", { errorRegister: req.query.error || null })
});

usersRouter.get("/login", (req, res) => {
    res.render("login", { errorLogin: req.query.error || null })
  });

// db.run("INSERT INTO users (name, password) VALUES (?, ?)", [req.body.username_login, hash])

usersRouter.post("/register", async (req, res) => {
    const { username, password } = req.body;
    console.log("user creating", username, password, await userExists(username))
    if (!username || !password || await userExists(username)) { return res.status(400).render("register", {errorRegister: "Bruker med lik informasjon eksisterer allerede"})}
    const newUserId = await createUser(username, password)
    await createAccount(newUserId)
    res.redirect("/users/login")
});


usersRouter.post("/login", async (req, res) => {
    const { username, password } = req.body;
    res.clearCookie("selected_account");

try{
    const token = await login(username, password)

    res.cookie("token", token, {maxAge: 1000 * 3600})
    console.log(token)
    res.redirect("/")
  }catch (err){
    res.status(400).render("login", { errorLogin: err.message });
  }

});





module.exports = { usersRouter }