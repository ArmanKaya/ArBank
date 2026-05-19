const express = require("express")
const jwt = require("jsonwebtoken")
const supportRouter = express.Router()
const {
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
} = require("../models/support")

function requireUser(req, res, next) {
    if (!req.user || !req.user.id) return res.redirect("/users/login")
    next()
}

function normalizeStatus(status) {
    if (!status) return status
    if (status === "Ny") return "Ny"
    if (status === "Under behandling") return "Under behandling"
    return "Løst"
}

function sortTicketsByStatus(tickets) {
    const priority = { Ny: 0, "Under behandling": 1, "Løst": 2 }
    return tickets.sort((a, b) => {
        const aPrio = priority[normalizeStatus(a.status)] ?? 99
        const bPrio = priority[normalizeStatus(b.status)] ?? 99
        if (aPrio !== bPrio) return aPrio - bPrio
        return (b.id || 0) - (a.id || 0)
    })
}

function isClosedStatus(status) {
    return normalizeStatus(status) === "Løst"
}

async function requireEmployee(req, res, next) {
    if (req.user && req.user.id) {
        const employee = await getEmployeeByUserId(req.user.id)
        if (employee) {
            req.employee = { id: employee.user_id, navn: employee.navn, stilling: employee.stilling }
            return next()
        }
    }

    try {
        const payload = jwt.verify(req.cookies.support_employee_token, "support_secret")
        req.employee = payload
        next()
    } catch (error) {
        res.redirect("/support/ansatt")
    }
}

function makeStats(tickets) {
    const total = tickets.length
    const ny = tickets.filter((t) => normalizeStatus(t.status) === "Ny").length
    const under = tickets.filter((t) => normalizeStatus(t.status) === "Under behandling").length
    const lost = tickets.filter((t) => normalizeStatus(t.status) === "Løst").length
    return {
        total,
        ny,
        under,
        lost,
        nyPct: total ? Math.round((ny / total) * 100) : 0,
        underPct: total ? Math.round((under / total) * 100) : 0,
        lostPct: total ? Math.round((lost / total) * 100) : 0
    }
}

async function renderUserSupport(req, res, ok = null, error = null) {
    const tickets = await getTicketsByUser(req.user.id)
    res.render("support_user", { tickets, ok, error })
}

async function renderEmployeeDashboard(req, res, ok = null, error = null) {
    const tickets = sortTicketsByStatus(await getAllTickets()).map((ticket) => ({
        ...ticket,
        status: normalizeStatus(ticket.status)
    }))
    const activeTickets = tickets.filter((t) => t.status !== "Løst")
    const closedTickets = tickets.filter((t) => t.status === "Løst")
    const stats = makeStats(tickets)

    res.render("support_employee_dashboard", {
        activeTickets,
        closedTickets,
        stats,
        employee: req.employee,
        ok,
        error
    })
}

async function renderThread(res, ticket, ticketId, role, ok = null, error = null) {
    const messages = await getMessagesByTicket(ticketId)
    res.render("support_ticket_thread", { ticket, messages, role, ok, error })
}

supportRouter.get("/bruker", requireUser, async (req, res) => {
    const employee = await getEmployeeByUserId(req.user.id)
    if (employee) return res.redirect("/support/ansatt/dashboard")
    await renderUserSupport(req, res)
})

supportRouter.get("/", async (req, res) => {
    if (req.user && req.user.id) {
        const employee = await getEmployeeByUserId(req.user.id)
        if (employee) return res.redirect("/support/ansatt/dashboard")
        return res.redirect("/support/bruker")
    }

    try {
        jwt.verify(req.cookies.support_employee_token, "support_secret")
        return res.redirect("/support/ansatt/dashboard")
    } catch (error) {
        return res.redirect("/users/login")
    }
})

supportRouter.get("/bruker/ticket/:id", requireUser, async (req, res) => {
    const ticket = await getTicketById(req.params.id)
    if (!ticket || ticket.user_id !== req.user.id) return renderUserSupport(req, res, null, "Ticket finnes ikke")
    await renderThread(res, ticket, req.params.id, "bruker")
})

supportRouter.post("/bruker/ticket/:id/message", requireUser, async (req, res) => {
    const ticket = await getTicketById(req.params.id)
    if (!ticket || ticket.user_id !== req.user.id) return renderUserSupport(req, res, null, "Ticket finnes ikke")
    if (!req.body.melding) return renderThread(res, ticket, req.params.id, "bruker", null, "Skriv en melding")
    await addMessage(req.params.id, "bruker", req.user.name, req.body.melding)
    await renderThread(res, ticket, req.params.id, "bruker", "Melding sendt")
})

supportRouter.post("/ticket", requireUser, async (req, res) => {
    const { tema, melding } = req.body
    if (!tema || !melding) return renderUserSupport(req, res, null, "Fyll inn alle felt")
    await createTicket(req.user.id, req.user.name, tema, melding)
    await renderUserSupport(req, res, "Ticket sendt")
})

supportRouter.post("/mail", requireUser, async (req, res) => {
    try {
        const { tema, melding } = req.body
        if (!tema || !melding) return renderUserSupport(req, res, null, "Fyll inn alle felt")
        await sendSupportMail(req.user.name, req.user.name, tema, melding)
        await renderUserSupport(req, res, "Mail sendt")
    } catch (error) {
        await renderUserSupport(req, res, null, error.message || "Klarte ikke sende mail")
    }
})

supportRouter.get("/ansatt", (req, res) => {
    res.render("support_employee_login", { error: null })
})

supportRouter.post("/ansatt/login", async (req, res) => {
    try {
        const { navn, passord } = req.body
        const token = await employeeLogin(navn, passord)
        res.cookie("support_employee_token", token, { maxAge: 1000 * 3600 * 24 * 10 })
        res.redirect("/support/ansatt/dashboard")
    } catch (error) {
        res.render("support_employee_login", { error: "Feil brukernavn eller passord" })
    }
})

supportRouter.post("/ansatt/logout", (req, res) => {
    res.clearCookie("support_employee_token")
    res.redirect("/support/ansatt")
})

supportRouter.get("/ansatt/dashboard", requireEmployee, async (req, res) => {
    await renderEmployeeDashboard(req, res)
})

supportRouter.get("/dashboard", requireEmployee, async (req, res) => {
    res.redirect("/support/ansatt/dashboard")
})

supportRouter.get("/ansatt/ticket/:id", requireEmployee, async (req, res) => {
    const ticket = await getTicketById(req.params.id)
    if (!ticket) return renderEmployeeDashboard(req, res, null, "Ticket finnes ikke")
    await renderThread(res, ticket, req.params.id, "ansatt")
})

supportRouter.post("/ansatt/ticket/:id/message", requireEmployee, async (req, res) => {
    const ticket = await getTicketById(req.params.id)
    if (!ticket) return renderEmployeeDashboard(req, res, null, "Ticket finnes ikke")
    if (!req.body.melding) return renderThread(res, ticket, req.params.id, "ansatt", null, "Skriv en melding")
    await addMessage(req.params.id, "ansatt", req.employee.navn, req.body.melding)
    await renderThread(res, ticket, req.params.id, "ansatt", "Melding sendt")
})

supportRouter.post("/ansatt/ticket", requireEmployee, async (req, res) => {
    const { ticket_id, svar } = req.body
    const status = normalizeStatus(req.body.status)
    if (!ticket_id || !status) return renderEmployeeDashboard(req, res, null, "Mangler felt")
    await updateTicket(ticket_id, status, svar || "")
    await renderEmployeeDashboard(req, res, "Ticket oppdatert")
})

supportRouter.post("/ansatt/ny", requireEmployee, async (req, res) => {
    if (req.employee.stilling !== "leder") {
        return renderEmployeeDashboard(req, res, null, "Kun leder kan legge til ansatte")
    }

    try {
        const { navn, stilling } = req.body
        if (!navn || !stilling) {
            return renderEmployeeDashboard(req, res, null, "Fyll inn alle felt")
        }
        await createEmployee(navn, stilling)
        await renderEmployeeDashboard(req, res, "Ansatt lagt til")
    } catch (error) {
        await renderEmployeeDashboard(req, res, null, error.message || "Noe gikk galt")
    }
})


module.exports = { supportRouter }

