const sqlite = require("sqlite3")
const db = new sqlite.Database("users.db")
const bcrypt = require("bcrypt")
var jwt = require('jsonwebtoken');


db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT)")

db.run("CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, balance INTEGER)")

async function getUserById(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
            if (err) reject(err)
            else resolve(row)
        })
    })
}


async function getUserByUsername(username) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE name = ?", [username], (err, row) => {
            if (err) reject(err)
            else resolve(row)
        })
    })
}


async function userExists(username) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE name = ?", [username], (err, row) => {
            if (row) resolve(true)
            else resolve(false)
        })
    })
}


async function createUser(username, password) {
    return new Promise(
        (resolve, reject) => {
            bcrypt.hash(password, 10,
                (err, hashed_password) => {
                    if (err) reject(err)
                    db.run("INSERT INTO users (name, password) VALUES (?, ?)", [username, hashed_password],
                        function (err) {
                            if (err) reject(err)
                            else resolve(this.lastID)
                        })
                })
        })
}


async function createAccount() {
    return new Promise(
        (resolve, reject) => {
            db.run("INSERT INTO accounts (balance) VALUES (0)",
                function (err) {
                    if (err) return reject(err)
                    else resolve(this.lastID)
                    }
                
            )
        })
}


async function login(username, password) {
    const userId = (await getUserByUsername(username)).id
    var token = await jwt.sign({id: userId}, 'shhhhh', {expiresIn: "3h"});
    return token

    
}

module.exports = {createAccount, createUser, userExists, getUserById, getUserByUsername, login}