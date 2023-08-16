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

app.route("/api/task/overdue")
    .post(controller.fetchAllOverdueCategories)

app.route("/api/task/completed")
    .post(controller.fetchAllCompletedCategories)

app.route("/api/task/date/:dateString")
    .get(controller.fetchTaskByDate)

export default app;