const db = require("../model");

const getAllSy = async (_, res) => {
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
}

const getSy = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM school_year WHERE id = $1", [req.params.id]);
        res.status(201).json({
            status: "sucess",
            result: result.rows
        })
    } catch (e) {
        res.status(500).send();
    }
}

const addSy = async (req, res) => {
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
}

const updateSy = async (req, res) => {
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
}

const deleteSy = async (req, res) => {
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
}

module.exports = {
    getAllSy,
    getSy,
    addSy,
    updateSy,
    deleteSy
}