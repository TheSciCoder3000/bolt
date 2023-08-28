import bcrypt from "bcryptjs";
import LocalPassport from "passport-local";
import { PassportStatic } from "passport"
import User from "../model/User.model";
import AppDataSource from "../model/setup";

declare global {
    namespace Express {
        interface User {
            id: string;
        }
    }
}

const localStrategy = LocalPassport.Strategy;

export default function(passport: PassportStatic) {
    passport.use(
        new localStrategy(async (username, password, done) => {
            try {
                const userRepo = await AppDataSource.getRepository(User);
                const user = await userRepo.findOne({
                    where: {
                        username: username
                    }
                })
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
            const userRepo = await AppDataSource.getRepository(User);
            const user = await userRepo.findOne({
                where: {
                    id: id as string
                }
            })
            cb(null, user);
        } catch (e) {
            cb(e, false);
        }
    });
}