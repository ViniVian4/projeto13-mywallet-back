import express from "express";
import cors from "cors";

import {login} from "./controllers/loginController.js";
import { signUp } from "./controllers/signUpController.js";
import { deposit, getTransactions, withdraw } from "./controllers/transactionController.js";

const app = express();

app.use(express.json());
app.use(cors());

//Login Route

app.post("/", login);

//Sign-up Route

app.post("/SignUp", signUp);


//deposit Route

app.post("/deposit", deposit);

// withdraw route

app.post("/withdraw", withdraw);

//wallet route

app.get("/wallet", getTransactions);

app.listen(5000);