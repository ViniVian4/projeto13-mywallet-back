import express from "express";
import cors from "cors";

import loginRouter from "./routers/loginRouter.js";
import signUpRouter from "./routers/signUpRouter.js";
import transactionRouter from "./routers/transactionRouter.js"

const app = express();

app.use(express.json());
app.use(cors());

app.use(loginRouter);
app.use(signUpRouter);
app.use(transactionRouter);

app.listen(5000);