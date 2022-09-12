import joi from "joi";
import dayjs from 'dayjs';

import db from "../database/db.js";

const depositSchema = joi.object(
    {
        value: joi.number().required(),
        description: joi.string().required()
    });

async function deposit (req, res) {
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

        const date = dayjs().format('DD/MM');

        await db.collection("deposits").insertOne(
            {
                userId: session.userId,
                value: Number(value),
                description: description,
                date: date,
                isDeposit: true
            }
        );

        res.sendStatus(201);
    } catch (error) {
        res.sendStatus(500);
    }
}

const withdrawSchema = joi.object(
    {
        value: joi.number().required(),
        description: joi.string().required()
    });

async function withdraw(req, res) {
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

        const date = dayjs().format('DD/MM');

        await db.collection("deposits").insertOne(
            {
                userId: session.userId,
                value: Number(value),
                description: description,
                date: date,
                isDeposit: false
            }
        );

        res.sendStatus(201);
    } catch (error) {
        res.sendStatus(500);
    }
}

async function getTransactions (req, res) {
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

        const depositsArray = await db.collection("deposits")
            .find({ userId }).toArray();

        res.send(
            {
                depositsArray
            }
        );
    } catch (error) {
        res.sendStatus(500);
    }
}

export { deposit, withdraw, getTransactions }