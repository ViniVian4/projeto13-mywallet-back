import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import joi from "joi";
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';

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


//deposit Route

const depositSchema = joi.object(
    {
        value: joi.number().required(),
        description: joi.string().required()
    });

app.post("/deposit", async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if (!token) {
        res.sendStatus(401);
        return;
    }

    try {
        const session = await db.collection("sessions").findOne({ token });

        if (!session) {
            res.sendStatus(401);
            return;
        }

        const depositData = req.body;
        const validation = depositSchema.validate(depositData, { abortEarly: true });
        if (validation.error) {
            res.status(422).send("Algum dado está inválido");
            return;
        }

        const { value, description } = depositData;

        const date = dayjs().format('DD/MM/YYYY');

        await db.collection("deposits").insertOne(
            {
                userId: session.userId,
                depositValue: Number(value),
                description: description,
                date: date
            }
        );

        res.sendStatus(201);
    } catch (error) {
        res.sendStatus(500);
    }
});

// withdraw route

const withdrawSchema = joi.object(
    {
        value: joi.number().required(),
        description: joi.string().required()
    });

app.post("/withdraw", async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if (!token) {
        res.sendStatus(401);
        return;
    }

    try {
        const session = await db.collection("sessions").findOne({ token });

        if (!session) {
            res.sendStatus(401);
            return;
        }

        const withdrawData = req.body;
        const validation = withdrawSchema.validate(withdrawData, { abortEarly: true });
        if (validation.error) {
            res.status(422).send("Algum dado está inválido");
            return;
        }

        const { value, description } = withdrawData;

        const date = dayjs().format('DD/MM/YYYY');

        await db.collection("withdraws").insertOne(
            {
                userId: session.userId,
                withdrawValue: Number(value),
                description: description,
                date: date
            }
        );

        res.sendStatus(201);
    } catch (error) {
        res.sendStatus(500);
    }
});

//wallet route

app.get("/wallet", async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if (!token) {
        res.sendStatus(401);
        return;
    }

    try {
        const session = await db.collection("sessions").findOne({ token });

        if (!session) {
            res.sendStatus(401);
            return;
        }

        const userId = session.userId;

        const depositsArray = await db.collection("deposits").find({ userId }).toArray();
        const withdrawsArray = await db.collection("withdraws").find({ userId }).toArray();

        res.send(
            {
                depositsArray,
                withdrawsArray
            }
        );
    } catch (error) {
        res.sendStatus(500);
    }
})

app.listen(5000);