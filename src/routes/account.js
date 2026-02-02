const express = require("express")
const { getBalance, db } = require("../models/users")
const accountRouter = express.Router()
const sqlite = require("sqlite3")


accountRouter.get("/", async (req, res) => {
    balance = await getBalance(req.user.id)
    res.render("konto", { balance: balance, card_number: "2483 3747 3847 2934" })
  });

accountRouter.get("/tjenester", async (req, res) => {
    const balance = await getBalance(req.user.id);
    res.render("tjenester", { balance });
});

accountRouter.post("/tjenester", async (req, res) => {
    const userId = req.user.id;

    // Gain random amount
    const gain = Math.floor(Math.random() * 150) + 50;

    // Get current balance
    const currentBalance = await getBalance(userId);
    const newBalance = currentBalance + gain;

    // Update DB
    await new Promise((resolve, reject) => {
        db.run(
            "UPDATE accounts SET balance = ? WHERE id = ?",
            [newBalance, userId],
            (err) => (err ? reject(err) : resolve())
        );
    });

    // Re-render the page with updated balance
    res.render("tjenester", { balance: newBalance });
});


module.exports = { accountRouter }