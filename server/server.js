require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const db = require("./db");

const app = express();
const port = process.env.PORT || 3005;

// ================================== Middleware ==================================
app.use(morgan("dev"));
app.use(express.json());

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