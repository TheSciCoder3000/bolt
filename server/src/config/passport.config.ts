import bcrypt from "bcryptjs";
import LocalPassport from "passport-local";
import { PassportStatic } from "passport"
import { UserRepository } from "../model/setup";

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
                const user = await UserRepository.findOne({
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
        console.log("serializing user")
        cb(null, user.id);
    });

    passport.deserializeUser(async (id, cb) => {
        console.log("deserializing user: ", id)
        try {
            const user = await UserRepository.findOne({
                where: {
                    id: id as string
                }
            })
            console.log(user)
            cb(null, user);
        } catch (e) {
            cb(e, false);
        }
    });
}