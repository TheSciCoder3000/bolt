import session from "express-session";
import PgSimple from "connect-pg-simple";
import db from "../model"

const pgSession = PgSimple(session);


export default () => session({
    secret: process.env.SECRET || "",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    store: new pgSession({
      pool: db.pool
    }),
})