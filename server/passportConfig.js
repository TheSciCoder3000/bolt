const db = require("./db");
const bcrypt = require("bcryptjs");
const localStrategy = require("passport-local").Strategy;

module.exports = function(passport) {
    passport.use(
        new localStrategy(async (username, password, done) => {
            try {
                const user = await db.query("SELECT * FROM bolt_user WHERE username = $1;", [username]).then(res => {
                    if (res.rows.length > 0) return res.rows[0];
                    else return null;
                });
                if (!user) return done(null, false);
                const { password: hashPassword, ...parsedUser } = user;
                bcrypt.compare(password, hashPassword, (err, result) => {
                    if (err) throw err;
                    if (result) return done(null, parsedUser);
                    else return done(null, false);
                })
            } catch (e) {
                throw e
            }

        })
    );

    passport.serializeUser((user, cb) => {
        cb(null, user.id);
    });

    passport.deserializeUser(async (id, cb) => {
        try {
            const user = await db.query("SELECT * FROM bolt_user WHERE id = $1;", [id]);
            cb(null, user.rows[0]);
        } catch (e) {
            cb(e, false);
        }
    });
}