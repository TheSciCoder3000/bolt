const db = require("../model");

module.exports = {
    login: (passport) => (req, res, next) => {
        passport.authenticate("local", (err, user) => {
            if (err) throw err;
            if (!user) res.status(404).json({ status: "error", msg: "No user exists" });
            else {
                req.logIn(user, err => {
                    if (err) throw err;
                    res.status(200).json({ status: "success", msg: "Successfully Authenticated", user });
                    // console.log(req);
                })
            }
        })(req, res, next);
    },

    register: () => async (req, res) => {
        bcrypt.hash(req.body.password, 10)
            .then(async (hashPassword) => {
                db.query("SELECT * FROM bolt_user WHERE username = $1;", [req.body.username])
                    .then(user => {
                        if (user.rows.length > 0) res.status(409).json({ status: "Conflict", msg: "User already exists" });
                        else {
                            db.query(
                                "INSERT INTO bolt_user (username, password) VALUES ($1, $2);", 
                                [req.body.username, hashPassword]
                            )
                            .then(() => res.status(201).json({ status: "success", msg: "User successfuly created" }))
                            .catch(() => res.status(500).json({ status: "Db error", msg: "unable to insert user to db" }))
                        }
                    })
                    .catch(e => res.status(500).json({ status: "Db error", msg: "unable to find user in db" }))
            })
            .catch(() => res.status(500).json({ status: "Hashing Failed", msg: "Password Hashing failed" }));
    
    },

    logout: () => (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            res.status(200).json({ status: "success", msg: "user logged out" })
        })
    }
}