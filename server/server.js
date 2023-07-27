require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const db = require("./model");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3005;

const sessionConfig = require("./config/session.config");

// apis
const authApi = require("./api/auth.api")
const subjectApi = require("./api/subject.api")

// ================================== Middleware ==================================
app.use(morgan("dev"));

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(sessionConfig());
app.use(cookieParser(process.env.SECRET));

app.use(passport.initialize());
app.use(passport.session());
require("./config/passport.config")(passport);

// ================================== Auth api ==================================
app.use(authApi(passport))

// ================================== School year api ==================================
app.use(subjectApi())

app.listen(port, () => {
    if (!process.env.PORT) {
        console.log("Port env variable is undefined, using default port 3005");
        console.log("please set up a .env file to configure your ports");
    }
    console.log(`listenning to port ${port}`);
});