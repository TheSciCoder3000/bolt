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
    const results = await db.query("SELECT * FROM school_year;");
    console.log(results);
    res.json({
        status: "success",
        results: results.rows.length,
        school_years: results.rows
    })
})

app.get("/api/school-year/:id", async (req, res) => {
    const result = await db.query(`SELECT * FROM school_year WHERE id = ${req.params.id}`);
    res.status(201).json({
        status: "sucess",
        result: result.rows
    })
})

app.post("/api/school-year", (req, res) => {
    res.status(200).json({
        status: "success"
    })
})

app.put("/api/school-year/:id", (req, res) => {
    res.status(200).json({
        status: "success",
        modified_id: req.params.id
    })
})

app.delete("/api/school-year/:id", (req, res) => {
    res.status(204).json({
        status: "success",
        deleted_id: req.params.id
    })
})

app.listen(port, () => {
    if (!process.env.PORT) {
        console.log("Port env variable is undefined, using default port 3005");
        console.log("please set up a .env file to configure your ports");
    }
    console.log(`listenning to port ${port}`);
});