import joi from "joi";
import bcrypt from 'bcrypt';

import db from "../database/db.js";

const signUpSchema = joi.object(
    {
        name: joi.string().trim().required(),
        email: joi.string().email().required(),
        password: joi.string().trim().required(),
        confirmPassword: joi.ref('password')

    }
);

async function signUp (req, res) {
    const user = req.body;

    const validation = signUpSchema.validate(user, { abortEarly: true });
    if (validation.error) {
        res.status(422).send("Algum dado está inválido");
        return;
    }

    const { name, email, password, confirmPassword } = user;

    const passwordHash = bcrypt.hashSync(password, 10);

    try {
        const dbUser = await db.collection("users").findOne({ email: email });

        if (dbUser) {
            res.status(409).send("Esse usuário já existe");
            return;
        }

        await db.collection("users").insertOne({
            name: name,
            email: email,
            password: passwordHash
        });

        res.sendStatus(201);

    } catch (error) {
        res.sendStatus(500);
    }
}

export { signUp };