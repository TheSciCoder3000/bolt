const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);


module.exports = () => session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    store: new pgSession({
        conString: process.env.CON_STRING,
      })
})