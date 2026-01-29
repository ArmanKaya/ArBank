const express = require("express")
const app = express()

const bodyParser = require("body-parser")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var path = require("path")
const usersRouter = require("./routes/users")


app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

const port = 3001

app.use((req, res, next) => {
    console.log("Request to:", req.path)
    next()
})

app.use("/users", usersRouter)
app.get("/", (req, res) => {
    res.render("index")
})

app.listen(port,() => {
    console.log(`Server is running on ${port}`)
})

