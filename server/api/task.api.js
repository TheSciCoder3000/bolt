const express = require("express");
const app = express();

const controller = require("../controllers/task.controller");

app.route("/api/task")
    .get(controller.getAllTasks)
    .post(controller.addTask);

app.route("/api/task/:id")
    .get()
    .put(controller.updateTask)
    .delete();

module.exports = app;