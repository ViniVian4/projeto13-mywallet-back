import express from "express";

import { deposit, getTransactions, withdraw } from "../controllers/transactionController.js";

const router = express.Router();

router.post("/deposit", deposit);
router.post("/withdraw", withdraw);
router.get("/wallet", getTransactions);

export default router;