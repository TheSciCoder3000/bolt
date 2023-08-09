import express from "express";
const app = express();

import controller from "../controllers/task.controller";

app.route("/api/task")
    .get(controller.getAllTasks)
    .post(controller.addTask);

app.route("/api/task/:id")
    .get()
    .put(controller.updateTask)
    .delete();

app.route("/api/task/category")
    .get()

export default app;