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

//Login Route

const userSchema = joi.object(
    {
        email: joi.string().email().required(),
        password: joi.string().required()
    }
);

app.post("/", async (req, res) => {
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

            return res.send(token);
        } else {
            res.sendStatus(401);
            return;
        }

    } catch (error) {
        res.sendStatus(500);
    }
});





//Sign-up Route

const signUpSchema = joi.object(
    {
        name: joi.string().trim().required(),
        email: joi.string().email().required(),
        password: joi.string().trim().required(),
        confirmPassword: joi.ref('password')

    }
);


app.post("/SignUp", async (req, res) => {
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
});



app.listen(5000);