import Express from "express";
import { PassportStatic } from "passport";
const app = Express();

import controllers from "../controllers/auth.controller";

export default function (passport: PassportStatic) {
    app.post("/api/login", controllers.login(passport))
    
    app.post("/api/register", controllers.register())
    
    app.post("/api/logout", controllers.logout())

    app.post("/api/user", controllers.fetchUser())

    return app
}