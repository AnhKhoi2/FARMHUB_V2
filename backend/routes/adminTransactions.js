import { Router } from "express";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";
import {
  listTransactions,
  getTransaction,
} from "../controllers/adminTransactionController.js";

const router = Router();

// GET /admin/transactions
router.get("/", verifyToken, requireAdmin, listTransactions);

// GET /admin/transactions/:id
router.get("/:id", verifyToken, requireAdmin, getTransaction);

export default router;
