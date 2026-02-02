const render = require("ejs")
const express = require("express")
var jwt = require('jsonwebtoken');
const {createAccount, createUser, userExists, login, userId, getBalance} = require("../models/users")
const kontoRouter = express.Router()
const sqlite = require("sqlite3")
const db = sqlite



module.exports = { usersRouter };