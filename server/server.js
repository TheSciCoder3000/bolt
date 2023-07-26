require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const db = require("./db");
const cors = require("cors");
const passport = require("passport");
const passportLocal = require("passport-local");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3005;
const secret = process.env.SECRET

// ================================== Middleware ==================================
app.use(morgan("dev"));
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: secret,
    resave: true,
    saveUninitialized: true
}));
app.use(cookieParser(secret));
app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);

// ================================== Auth api ==================================
app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) throw err;
        if (!user) res.json({ status: "error", msg: "No user exists" });
        else {
            req.logIn(user, err => {
                if (err) throw err;
                res.status(200).json({ status: "success", msg: "Successfully Authenticated", user });
                // console.log(req);
            })
        }
    })(req, res, next);
})

app.post("/api/register", async (req, res) => {
    const hashPassword = await bcrypt.hash(req.body.password, 10);

    try {
        const user = await db.query("SELECT * FROM bolt_user WHERE username = $1;", [req.body.username]);
        if (user.rows.length > 0) res.status(500).json({ status: "error", msg: "User already exists" });
        else {
            await db.query("INSERT INTO bolt_user (username, password) VALUES ($1, $2);", [req.body.username, hashPassword])
            res.status(201).json({ status: "success", msg: "User successfuly created" });
        }

    } catch (e) {
        throw err;
    }
})

app.get("/api/tasks", async (req, res) => {
    console.log(req.isAuthenticated())
    res.status(200).send();
})

// ================================== School year api ==================================
app.get("/api/school-year", async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM school_year ORDER BY id;");
        res.json({
            status: "success",
            results: results.rows.length,
            school_years: results.rows
        })
    } catch (e) {
        res.status(500).send();
    }
})

app.get("/api/school-year/:id", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM school_year WHERE id = $1", [req.params.id]);
        res.status(201).json({
            status: "sucess",
            result: result.rows
        })
    } catch (e) {
        res.status(500).send();
    }
})

app.post("/api/school-year", async (req, res) => {
    try {
        const results = await db.query(
            "INSERT INTO school_year (name) VALUES ($1) returning *;",
            [req.body.name]
        )
        res.status(200).json({
            status: "success",
            results: results.rows[0]
        })
    } catch (e) {
        console.log(e)
        res.status(500).send();
    }
})

app.put("/api/school-year/:id", async (req, res) => {
    try {
        const results = await db.query(
            "UPDATE school_year SET name = $1 WHERE id = $2 returning *;",
            [req.body.name, req.params.id]
        )
        res.status(200).json({
            status: "success",
            modified_id: req.params.id,
            results: results.rows[0]
        })
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
})

app.delete("/api/school-year/:id", async (req, res) => {
    try {
        await db.query(
            "DELETE FROM school_year WHERE id = $1;",
            [req.params.id]
        )
        res.status(200).json({
            status: "success",
            modified_id: req.params.id
        })
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
})

app.listen(port, () => {
    if (!process.env.PORT) {
        console.log("Port env variable is undefined, using default port 3005");
        console.log("please set up a .env file to configure your ports");
    }
    console.log(`listenning to port ${port}`);
});