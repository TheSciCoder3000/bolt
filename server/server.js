require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const db = require("./db");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const bodyParser = require("body-parser");
const pgSession = require("connect-pg-simple")(session);

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
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    store: new pgSession({
        conString: process.env.CON_STRING,
      })
}));
app.use(cookieParser(secret));
app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);

// ================================== Auth api ==================================
app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user) => {
        if (err) throw err;
        if (!user) res.status(404).json({ status: "error", msg: "No user exists" });
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
    bcrypt.hash(req.body.password, 10)
        .then(async (hashPassword) => {
            db.query("SELECT * FROM bolt_user WHERE username = $1;", [req.body.username])
                .then(user => {
                    if (user.rows.length > 0) res.status(409).json({ status: "Conflict", msg: "User already exists" });
                    else {
                        db.query(
                            "INSERT INTO bolt_user (username, password) VALUES ($1, $2);", 
                            [req.body.username, hashPassword]
                        )
                        .then(() => res.status(201).json({ status: "success", msg: "User successfuly created" }))
                        .catch(e => res.status(500).json({ status: "Db error", msg: "unable to insert user to db" }))
                    }
                })
                .catch(e => res.status(500).json({ status: "Db error", msg: "unable to find user in db" }))
        })
        .catch(() => res.status(500).json({ status: "Hashing Failed", msg: "Password Hashing failed" }));

})

app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.status(200).json({ status: "success", msg: "user logged out" })
    })
})

app.get("/api/tasks", async (req, res) => {
    console.log(req.isAuthenticated())
    res.status(200).json({ status: "succeess", msg: req.isAuthenticated() ? "user is authenticated" : "user not authenticated" });
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