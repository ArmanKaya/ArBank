const express = require("express");
const transferRouter = express.Router();
const { getBalance, updateBalance } = require("../models/accounts");

// Middleware to parse form data
transferRouter.use(express.urlencoded({ extended: true }));

transferRouter.get("/", (req, res) => {
  res.render("overfore");
});


transferRouter.post("/", async (req, res) => {

  const card = req.cookies.selected_account;      
  const amount = req.body.amount; 
  const reciever = req.body.selected_reciever

  const currentBalance = await getBalance(card);
  const recieveBalance = await getBalance(reciever);
  const newBalance = currentBalance - amount;

  if(currentBalance > amount){
  await updateBalance(card, newBalance, card);
  await updateBalance(reciever, recieveBalance + amount, card);
} else {
  res.redirect("/overfore")
}
  console.log(currentBalance, await getBalance(card))

  res.redirect("/konto");
});

module.exports = transferRouter;

module.exports = { transferRouter }