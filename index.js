import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import joi from "joi";
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
    db = mongoClient.db('MyWallet');
});

const signUpSchema = joi.object(
    {
        name: joi.string().trim().required(),
        email: joi.email().required(),
        password: joi.string().noWhiteSpaces().trim().required(),
        confirmPassword: joi.ref('password').required()

    }
);


app.post("/SignUp", async (req, res) => {
    const user = req.body;

    const validation = signUpSchema.validate(user, { abortEarly: true });
    if (validation.error){
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
});



app.listen(5000);