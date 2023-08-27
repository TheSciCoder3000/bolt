import "reflect-metadata";
import "dotenv/config"
import express from "express";
import morgan from "morgan";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import http from "http";
import socketListen from "./socket";
import { Server } from "socket.io"

// configs
import sessionConfig from "./config/session.config";
import corsConfig from "./config/cors.config";
import passportConfig from "./config/passport.config"

// apis
import authApi from "./api/auth.api";
import subjectApi from "./api/subject.api";
import taskApi from "./api/task.api";
import { AppDataSource } from "./model/setup";
import { User } from "./model/User.model";

const app = express();

// ================================== Middleware ==================================
AppDataSource.initialize()
    .then(async () => {
        app.use(morgan("dev"));     // server logs
        
        app.use(cors(corsConfig));  // enabling CORS
        
        // boodyParser Middleware
        app.use(bodyParser.json());         
        app.use(bodyParser.urlencoded({ extended: true }));
        
        app.use(sessionConfig());       // express-session middleware
        app.use(cookieParser(process.env.SECRET));      // cookie parser middleware
        
        // initializing passport middleware
        app.use(passport.initialize());
        app.use(passport.session());
        passportConfig(passport);
        
        // ================================== API ==================================
        app.use(authApi(passport))          // auth API
        // app.use(subjectApi())               // subject API
        app.use(taskApi)
        
        const server = http.createServer(app);
        const io = new Server(server, { cors: corsConfig })
        
        io.engine.use(sessionConfig())
        socketListen(io)
        
        server.listen(process.env.PORT || 3005, async () => {
            console.log(`Listening to port ${process.env.PORT}`)
            const user = await AppDataSource.manager.find(User)
            console.log(user)
        });
    })
