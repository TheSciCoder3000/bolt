const express = require("express");
const app = express();

const controller = require("../controllers/subject.controller")

module.exports = () => {
    app.route("/api/school-year")
        .get(controller.getAllSy)
        .post(controller.addSy);
    
    app.route("/api/school-year/:id")
        .get(controller.getSy)
        .put(controller.updateSy)
        .delete(controller.deleteSy);
    
    return app
}