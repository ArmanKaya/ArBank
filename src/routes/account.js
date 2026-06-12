const express = require("express")
const {db} = require("../models/users")
const { getBalance, findCardById, findCards, createAccount, getNewestCard, updateBalance, createTransaction, getTransactions} = require("../models/accounts")
const accountRouter = express.Router()
const sqlite = require("sqlite3")
const { render } = require("ejs")
const { get } = require("mongoose")

function formatAmount(amount) {
    const sign = amount > 0 ? "+" : "-"
    return `${sign}${Math.abs(amount).toLocaleString("no-NO")},00 NOK`
}

function formatDate(date) {
    return date.toLocaleDateString("no-NO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

accountRouter.get("/", async (req, res) => {
    const cardNumber = req.cookies.selected_account;
    const balance = await getBalance(cardNumber);
    const transactions = await getTransactions(cardNumber);

    res.render("konto", { balance: balance, card_number: cardNumber, transactions })
})



accountRouter.post("/", async (req, res) =>{
    
})


accountRouter.get("/tjenester", async (req, res) => {
    const cardNumber = req.cookies.selected_account;
    const balance = await getBalance(cardNumber);
    res.render("tjenester", { balance });
});

accountRouter.post("/tjenester", async (req, res, next) => {
    const cardNumber = req.cookies.selected_account;
    if (!cardNumber) return res.redirect("/konto");

    const currentBalance = await getBalance(cardNumber);
    const isGain = currentBalance <= 0 || Math.random() >= 0.45;
    const randomAmount = Math.floor(Math.random() * 451) + 50;
    const amount = isGain ? randomAmount : -Math.min(randomAmount, currentBalance);
    const newBalance = currentBalance + amount;

    await updateBalance(cardNumber, newBalance);
    await createTransaction(cardNumber, {
        date: formatDate(new Date()),
        text: amount >= 0 ? "Trading gevinst" : "Trading tap",
        category: "Tjenester",
        amount,
        type: amount >= 0 ? "in" : "out",
        sender: amount >= 0 ? "Trading Simulator" : cardNumber,
        receiver: amount >= 0 ? cardNumber : "Trading Simulator",
        reference: `TR-${Date.now()}`,
    });

    res.redirect("/konto/tjenester");
});


accountRouter.post("/nytt-kort", async (req, res) => {
    await createAccount(req.user.id)
    res.redirect("/konto")

})

accountRouter.get("/bytt-kort", async (req, res) => {
    const accounts = await findCards(req.user.id);
    res.render("bytt_kort", { accounts });
});

accountRouter.post("/bytt-kort", async (req, res) => {
    const selectedCard = req.body.selectedCard;
    const new_card = await findCardById(selectedCard);

    if (selectedCard) {
        res.cookie("selected_account", new_card.cardNumber);
        const transactions = await getTransactions(new_card.cardNumber);
        res.render("konto", { balance: new_card.balance, card_number: new_card.cardNumber, transactions});
    } else {
        const newest_card = await getNewestCard(req.user.id);
        const transactions = await getTransactions(newest_card.cardNumber);
        res.render("konto", { balance: newest_card.balance, card_number: newest_card.cardNumber, transactions });
    }



});
module.exports = { accountRouter }


