const express = require("express")
const inforoute = express.Router()
const { render } = require("ejs")

inforoute.get("/", (req, res) => {
    res.render("info")
  })


module.exports = {inforoute}