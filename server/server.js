require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const http = require("http");
const socketListen = require("./socket");

// configs
const sessionConfig = require("./config/session.config");
const corsConfig = require("./config/cors.config");

// apis
const authApi = require("./api/auth.api");
const subjectApi = require("./api/subject.api");
const taskApi = require("./api/task.api");

const app = express();

// ================================== Middleware ==================================
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
require("./config/passport.config")(passport);

// ================================== API ==================================
app.use(authApi(passport))          // auth API
app.use(subjectApi())               // subject API
app.use(taskApi)

const server = http.createServer(app);

const io = require('socket.io')(server, { cors: corsConfig })

io.engine.use(sessionConfig())
socketListen(io)

server.listen(process.env.PORT || 3005);