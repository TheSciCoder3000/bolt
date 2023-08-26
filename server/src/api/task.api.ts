import express from "express";
const app = express();

import controller from "../controllers/task.controller";

app.route("/api/task")
    .get(controller.getAllTasks)
    .post(controller.addTask);

app.route("/api/task/:id")
    .get(controller.getTask)
    .put(controller.updateTask)
    .delete(controller.deleteTask);

app.route("/api/task/overdue")
    .post(controller.fetchAllOverdueCategories)

app.route("/api/task/completed")
    .post(controller.fetchAllCompletedCategories)

app.route("/api/task/month/:yearMonth")
    .get(controller.fetchTaskByMonth)

    export default app;