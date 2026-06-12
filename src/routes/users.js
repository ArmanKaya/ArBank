const express = require("express")
const usersRouter = express.Router()
const jwt = require("jsonwebtoken")

const rateLimit = require("express-rate-limit")

const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minutt
    max: 5, // maks 5 requests per IP per i minuttet
    message: "For mange forsøk, prøv igjen senere"
})
const {
    createUser,
    userExists,
    login,
    deleteUser
} = require("../models/users")

const {
    createAccount,
    deleteAccount
} = require("../models/accounts")

usersRouter.get("/register", (req, res) => {
    res.render("register", { errorRegister: req.query.error || null })
})

usersRouter.get("/login", (req, res) => {
    res.render("login", { errorLogin: req.query.error || null })
})

usersRouter.post("/register", async (req, res) => {
    const { username, password } = req.body

    try {
        const exists = await userExists(username)

        if (!username || !password || exists) {
            return res.status(400).render("register", {
                errorRegister: "Bruker finnes allerede"
            })
        }

        const newUserId = await createUser(username, password)
        await createAccount(newUserId)

        res.redirect("/users/login")
    } catch (err) {
        res.status(500).render("register", {
            errorRegister: err.message
        })
    }
})

usersRouter.post("/login", loginLimiter,  async (req, res) => {
    const { username, password } = req.body

    try {
        res.clearCookie("selected_account")

        const token = await login(username, password)

        res.cookie("token", token, {
            maxAge: 1000 * 3600 * 10
        })

        res.redirect("/")
    } catch (err) {
        res.status(400).render("login", {
            errorLogin: err.message
        })
    }
})

usersRouter.post("/slett-profil", async (req, res) => {
    try {
        const token = req.cookies.token
        if (!token) throw new Error("Ikke logget inn")

        const decoded = jwt.verify(token, "shhhhh")

        await deleteUser(decoded.id)
        await deleteAccount(decoded.id)
        
        res.clearCookie("selected_account")
        res.clearCookie("token")
        res.redirect("/")
    } catch (err) {
        res.status(400).render("konto", {
            errorDeletion: err.message,
            card_number: "Ingen kort",
            balance: 0
        })
    }
})

module.exports = { usersRouter }