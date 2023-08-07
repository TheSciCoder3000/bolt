import { PassportStatic } from "passport";
import db from "../model";
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";

declare module 'express-session' {
    export interface SessionData {
        passport: { user: string };
    }
}


export default {
    login: (passport: PassportStatic) => (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate("local", (err: unknown, user: {id: string}) => {
            if (err) throw err;
            if (!user) res.status(404).json({ status: "error", msg: "No user exists" });
            else {
                req.logIn(user, err => {
                    if (err) throw err;
                    res.status(200).json({ status: "success", msg: "Successfully Authenticated", user });
                })
            }
        })(req, res, next);
    },

    register: () => async (req: Request, res: Response) => {
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

    logout: () => (req: Request, res: Response, next: NextFunction) => {
        req.logout((err) => {
            if (err) return next(err);
            res.status(200).json({ status: "success", msg: "user logged out" })
        })
    },

    fetchUser: () => (req: Request, res: Response) => {
        const user = req.session.passport?.user; 
        if (user) {
            db.query("SELECT * FROM bolt_user WHERE id = $1;", [user])
                .then((result) => {
                    if (result.rows.length == 0) res.status(404).json({ status: "not found", msg: "user not found" })
                    else res.status(200).json({ status: "success", user: result.rows[0] })
                })
                .catch(err => res.status(500).json({ status: "Db error", msg: "unable to fetch user" }))
        } else res.status(403).json({ status: "forbidden", msg: "You are not logged in" })
    }
}