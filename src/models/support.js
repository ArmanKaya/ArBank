const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")
const { db } = require("./users")
const { getUserByUsername } = require("./users")
const bcrypt = require("bcrypt")

let supportInitDone = false
let supportInitPromise = null

async function initSupport() {
    if (supportInitDone) return
    if (supportInitPromise) return supportInitPromise

    supportInitPromise = new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("CREATE TABLE IF NOT EXISTS support_employees (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE, stilling TEXT)", (err) => {
                if (err) return reject(err)
            })

            db.run("CREATE TABLE IF NOT EXISTS support_tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, tema TEXT, melding TEXT, status TEXT DEFAULT 'Ny', svar TEXT DEFAULT '', created_at TEXT, updated_at TEXT)", (err) => {
                if (err) return reject(err)
            })

            db.run("CREATE TABLE IF NOT EXISTS support_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, ticket_id INTEGER, sender_type TEXT, sender_name TEXT, melding TEXT, created_at TEXT)", (err) => {
                if (err) return reject(err)
            })

            db.all("PRAGMA table_info(support_employees)", [], (err, rows) => {
                if (err) return reject(err)

                const hasUserId = rows.some((col) => col.name === "user_id")
                const hasStilling = rows.some((col) => col.name === "stilling")

                if (!hasUserId) {
                    db.run("ALTER TABLE support_employees ADD COLUMN user_id INTEGER", (alterErr) => {
                        if (alterErr) return reject(alterErr)
                    })
                }

                if (!hasStilling) {
                    db.run("ALTER TABLE support_employees ADD COLUMN stilling TEXT DEFAULT 'ansatt'", (alterErr) => {
                        if (alterErr) return reject(alterErr)
                    })
                }

                supportInitDone = true
                resolve()
            })
        })
    })

    return supportInitPromise
}

async function ensureLeaderForUser(username, password, stilling) {
    await initSupport()

    let user = await getUserByUsername(username)

    if (!user) {
        const hash = await bcrypt.hash(password, 10)
        const userId = await new Promise((resolve, reject) => {
            db.run("INSERT INTO users (name, password) VALUES (?, ?)", [username, hash], function (err) {
                if (err) reject(err)
                else resolve(this.lastID)
            })
        })
        user = { id: userId, name: username, password: hash }
    }

    const existing = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM support_employees WHERE user_id = ?", [user.id], (err, row) => {
            if (err) reject(err)
            else resolve(row)
        })
    })

    if (existing) return

    await new Promise((resolve, reject) => {
        db.run("INSERT INTO support_employees (user_id, stilling) VALUES  (?, ?)", [user.id, stilling], (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

async function ensureLeader() {
    await ensureLeaderForUser("Arman", "arman123", "leder")
    await ensureLeaderForUser("admin", "admin", "leder")
}

async function employeeLogin(navn, passord) {
    await initSupport()

    const user = await getUserByUsername(navn)
    if (!user) throw new Error("Bruker finnes ikke")

    const employee = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM support_employees WHERE user_id = ?", [user.id], (err, row) => {
            if (err) reject(err)
            else resolve(row)
        })
    })

    if (!employee) throw new Error("Du er ikke registrert som support-ansatt")

    const ok = await bcrypt.compare(passord, user.password)
    if (!ok) throw new Error("Passord er feil")

    return jwt.sign(
        { id: user.id, navn: user.name, stilling: employee.stilling },
        "support_secret",
        { expiresIn: "10d" }
    )
}

async function createEmployee(navn, stilling) {
    await initSupport()

    const user = await getUserByUsername(navn)
    if (!user) throw new Error("Bruker finnes ikke i ArBank")

    return new Promise((resolve, reject) => {
        db.run("INSERT INTO support_employees (user_id, stilling) VALUES (?, ?)", [user.id, stilling], function (err) {
            if (err) reject(err)
            else resolve(this.lastID)
        })
    })
}

async function getEmployeeByUserId(userId) {
    await initSupport()

    return new Promise((resolve, reject) => {
        db.get("SELECT support_employees.*, users.name AS navn FROM support_employees LEFT JOIN users ON users.id = support_employees.user_id WHERE support_employees.user_id = ?", [userId], (err, row) => {
            if (err) reject(err)
            else resolve(row)
        })
    })
}

async function createTicket(userId, tema, melding) {
    await initSupport()

    return new Promise((resolve, reject) => {
        db.run("INSERT INTO support_tickets (user_id, tema, melding, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))", [userId, tema, melding], function (err) {
            if (err) return reject(err)

            const ticketId = this.lastID
            db.run("INSERT INTO support_messages (ticket_id, sender_type, sender_name, melding, created_at) VALUES (?, 'bruker', ?, ?, datetime('now'))", [ticketId, String(userId), melding], (msgErr) => {
                if (msgErr) reject(msgErr)
                else resolve(ticketId)
            })
        })
    })
}

async function getTicketsByUser(userId) {
    await initSupport()

    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM support_tickets WHERE user_id = ? ORDER BY id DESC", [userId], (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
        })
    })
}

async function getAllTickets() {
    await initSupport()

    return new Promise((resolve, reject) => {
        db.all("SELECT support_tickets.*, users.name AS user_name FROM support_tickets LEFT JOIN users ON users.id = support_tickets.user_id ORDER BY support_tickets.id DESC", [], (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
        })
    })
}

async function updateTicket(id, status, svar) {
    await initSupport()

    return new Promise((resolve, reject) => {
        db.run("UPDATE support_tickets SET status = ?, svar = ?, updated_at = datetime('now') WHERE id = ?", [status, svar, id], (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

async function getTicketById(ticketId) {
    await initSupport()

    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM support_tickets WHERE id = ?", [ticketId], (err, ticket) => {
            if (err) return reject(err)
            if (!ticket) return resolve(null)

            db.get("SELECT name FROM users WHERE id = ?", [ticket.user_id], (userErr, user) => {
                if (userErr) return reject(userErr)
                ticket.user_name = user ? user.name : null
                resolve(ticket)
            })
        })
    })
}

async function getMessagesByTicket(ticketId) {
    await initSupport()

    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY id ASC", [ticketId], (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
        })
    })
}

async function addMessage(ticketId, senderType, senderName, melding) {
    await initSupport()

    return new Promise((resolve, reject) => {
        db.run("INSERT INTO support_messages (ticket_id, sender_type, sender_name, melding, created_at) VALUES (?, ?, ?, ?, datetime('now'))", [ticketId, senderType, senderName, melding], (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

function readMailConfig() {
    const mailConfigPath = path.join(__dirname, "../../mail.private.json")
    let user = process.env.MAIL_USER || null
    let pass = process.env.MAIL_PASS || null
    let to = process.env.MAIL_TO || null

    if ((!user || !pass) && fs.existsSync(mailConfigPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(mailConfigPath, "utf8"))
            user = user || config.user || null
            pass = pass || config.pass || null
            to = to || config.to || null
        } catch (error) {
            return null
        }
    }

    user = typeof user === "string" ? user.trim() : user
    pass = typeof pass === "string" ? pass.trim().replace(/\s+/g, "") : pass
    to = typeof to === "string" ? to.trim() : to

    if (!user || !pass) return null
    return { user, pass, to: to || user }
}

async function sendSupportMail(fromName, fromUser, tema, melding) {
    const mailConfig = readMailConfig()
    if (!mailConfig) throw new Error("Mail-oppsett mangler")

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: mailConfig.user,
            pass: mailConfig.pass
        }
    })

    await transporter.sendMail({
        from: mailConfig.user,
        to: mailConfig.to,
        subject: `[ArBank Feedback] ${tema}`,
        text: `Fra: ${fromName} (${fromUser})\nTema: ${tema}\n\n${melding}`
    })
}

module.exports = {
    ensureLeader,
    employeeLogin,
    createEmployee,
    getEmployeeByUserId,
    createTicket,
    getTicketsByUser,
    getAllTickets,
    updateTicket,
    getTicketById,
    getMessagesByTicket,
    addMessage,
    sendSupportMail
}
