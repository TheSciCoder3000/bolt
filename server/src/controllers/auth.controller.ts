import { PassportStatic } from "passport";
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { UserRepository } from "../model/setup";
import User from "../model/User.model";

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
                try {
                    const user = await UserRepository.findOne({ where: { username: req.body.username } });
                    if (user) res.status(409).json({ status: "Conflict", msg: "User already exists" });
                    else {
                        UserRepository
                            .createQueryBuilder("user")
                            .insert()
                            .into(User)
                            .values({
                                username: req.body.username,
                                password: hashPassword
                            })
                            .execute();
                        res.status(201).json({ status: "success", msg: "User successfuly created" })
                    }
                } catch (e) {
                    res.status(500).json({ status: "Db error", msg: "unable to find user in db" })
                }
            })
            .catch(() => res.status(500).json({ status: "Hashing Failed", msg: "Password Hashing failed" }));
    
    },

    logout: () => (req: Request, res: Response, next: NextFunction) => {
        req.logout((err) => {
            if (err) return next(err);
            res.status(200).json({ status: "success", msg: "user logged out" })
        })
    },

    fetchUser: () => async (req: Request, res: Response) => {
        const userId = req.session.passport?.user; 
        if (userId) {
            try {
                const user = await UserRepository.findOne({ where: { id: userId } });
                if (user) res.status(200).json({ status: "success", user: user });
                else res.status(404).json({ status: "not found", msg: "user not found" })
            } catch (e) {
                res.status(500).json({ status: "Db error", msg: "unable to fetch user" })
            }
        } else res.status(403).json({ status: "forbidden", msg: "You are not logged in" })
    }
}