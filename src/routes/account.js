const express = require("express")
const {db} = require("../models/users")
const { getBalance, findCardById, get_card, findCards, createAccount, getNewestCard} = require("../models/accounts")
const accountRouter = express.Router()
const sqlite = require("sqlite3")
const { render } = require("ejs")
const { get } = require("mongoose")

accountRouter.get("/", async (req, res) => {
    const cardNumber = req.cookies.selected_account;
    const balance = await getBalance(cardNumber);

    res.render("konto", { balance: balance, card_number: cardNumber })
})



accountRouter.post("/", async (req, res) =>{
    
})


accountRouter.get("/tjenester", async (req, res) => {
    const cardNumber = req.cookies.selected_account;
    const balance = await getBalance(cardNumber);
    res.render("tjenester", { balance });
});

accountRouter.post("/tjenester", async (req, res, next) => {
    
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
        res.render("konto", { balance: new_card.balance, card_number: new_card.cardNumber});
    } else {
        const newest_card = await getNewestCard(req.user.id);
        res.render("konto", {balance: newest_card.balance, card_number: newest_card.cardNumber
        });
    }



});
module.exports = { accountRouter }


