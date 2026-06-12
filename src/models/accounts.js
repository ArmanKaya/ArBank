const sqlite = require("sqlite3");
const db = new sqlite.Database("database.db");

db.run("CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, cardNumber TEXT, date TEXT, text TEXT, category TEXT, amount INTEGER, type TEXT, sender TEXT, receiver TEXT, reference TEXT)");

async function createAccount(userId) {
    let cardnumber = [];
    for (let part = 0; part < 4; part++) {
        cardnumber.push(Math.floor(Math.random() * 9000 + 1000));
    }
    const cardString = cardnumber.join("-");

    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO accounts (balance, userid, cardNumber) VALUES (?,?,?)",
            [0, userId, cardString],
            function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
            }
        );
    });
}

async function deleteAccount(id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM accounts WHERE userid = ?", [id], (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

async function getBalance(cardNumber) {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT balance FROM accounts WHERE cardNumber = ?",
            [cardNumber],
            (err, row) => {
                if (err) return reject(err);
                resolve(row ? row.balance : 0);
            }
        );
    });
}

async function findCardById(id) {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT * FROM accounts WHERE id = ?",
            [id],
            (err, row) => {
                if (err) return reject(err);
                resolve(row);
            }
        );
    });
}

async function updateBalance(cardNumber, newBalance) {
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE accounts SET balance = ? WHERE cardNumber = ?",
            [newBalance, cardNumber],
            (err) => (err ? reject(err) : resolve())
        );
    });
}

async function createTransaction(cardNumber, transaction) {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO transactions (cardNumber, date, text, category, amount, type, sender, receiver, reference) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                cardNumber,
                transaction.date,
                transaction.text,
                transaction.category,
                transaction.amount,
                transaction.type,
                transaction.sender,
                transaction.receiver,
                transaction.reference,
            ],
            function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
            }
        );
    });
}

async function getTransactions(cardNumber) {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT * FROM transactions WHERE cardNumber = ? ORDER BY id DESC",
            [cardNumber],
            (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
}

async function findCards(userId) {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT * FROM accounts WHERE userid = ? ORDER BY id DESC",
            [userId],
            (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
}

async function getNewestCard(userId) {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT * FROM accounts WHERE userid = ? ORDER BY id DESC LIMIT 1",
            [userId],
            (err, row) => {
                if (err) return reject(err);
                resolve(row);
            }
        );
    });
}

module.exports = {
    createAccount,
    getBalance,
    findCardById,
    updateBalance,
    createTransaction,
    getTransactions,
    findCards,
    getNewestCard,
    deleteAccount,
    db
};