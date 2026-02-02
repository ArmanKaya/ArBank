const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const jwt = require('jsonwebtoken');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
const path = require("path")
const { usersRouter } = require("./routes/users");
const { accountRouter } = require("./routes/account")




app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))

app.use((req, res, next) => {
    try {
        const payload = jwt.verify(req.cookies.token, 'shhhhh')
        req.user = {id: payload.id, name: payload.nickname}
    }

    catch (error) {
        req.user = {}
    } finally {
        console.log(req.user)
        next()
    }
})
    const port = 3001



app.use((req, res, next) => {
    console.log("Request to:", req.path)
    next()
})

app.use("/users", usersRouter)
app.use("/konto", accountRouter)

app.get("/", (req, res) => {
    res.render("index", { username: req.user.name })
})

app.listen(port,() => {
    console.log(`Server is running on ${port}`)
})

