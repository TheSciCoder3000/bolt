const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../model");

const app = express();

const controllers = require("../controllers/auth.controllers");

module.exports = function (passport) {
    app.post("/api/login", controllers.login(passport))
    
    app.post("/api/register", controllers.register())
    
    app.post("/api/logout", controllers.logout())
    
    app.get("/api/tasks", async (req, res) => {
        console.log(req.isAuthenticated())
        res.status(200).json({ status: "succeess", msg: req.isAuthenticated() ? "user is authenticated" : "user not authenticated" });
    })

    return app
}