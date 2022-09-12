import joi from "joi";
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt';

import db from "../database/db.js";

const userSchema = joi.object(
    {
        email: joi.string().email().required(),
        password: joi.string().required()
    }
);

async function login(req, res) {
    const user = req.body;

    const validation = userSchema.validate(user, { abortEarly: true });
    if (validation.error) {
        res.status(422).send("Usuário ou senha inválidos");
        return;
    }

    const { email, password } = user;

    try {
        const dbUser = await db.collection("users").findOne({ email });

        if (dbUser && bcrypt.compareSync(password, dbUser.password)) {
            const token = uuid();

            const dbToken = await db.collection("sessions").findOne({ userId: dbUser._id });

            if (dbToken) {
                await db.collection("sessions").updateOne(
                    {
                        _id: dbToken._id
                    },
                    {
                        $set:
                        {
                            token,
                            userId: dbUser._id
                        }
                    });
            } else {
                await db.collection("sessions").insertOne(
                    {
                        token,
                        userId: dbUser._id
                    }
                );
            }

            const userData = {
                token: token,
                name: dbUser.name
            }

            return res.send(userData);
        } else {
            res.sendStatus(401);
            return;
        }

    } catch (error) {
        res.sendStatus(500);
    }
}

export { login }