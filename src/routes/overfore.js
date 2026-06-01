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
  const amount = Number(req.body.amount); 
  const reciever = req.body.selected_reciever

  const currentBalance = await getBalance(card);
  const recieveBalance = await getBalance(reciever);
  const newBalance = currentBalance - amount;

  if (!reciever || !amount || amount <= 0) return res.redirect("/overfore")
  if (recieveBalance === 0) return res.redirect("/overfore")
  if(currentBalance >= amount){
    await updateBalance(card, newBalance);
    await updateBalance(reciever, recieveBalance + amount);
  } else {
    return res.redirect("/overfore")
  }
  console.log(currentBalance, await getBalance(card))

  res.redirect("/konto");
});


module.exports = { transferRouter }
