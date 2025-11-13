// backend/src/routes/expertApplicationRoutes.js
import { Router } from "express";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";
import {
  list, getMine, getById, create, approve, reject
} from "../controllers/expertApplicationController.js";

const router = Router();

// user (FE)
router.get("/mine", verifyToken, getMine);      // ✅ expertApplicationApi.getMine()
router.post("/", verifyToken, create);          // ✅ expertApplicationApi.create(payload)

// admin
router.get("/", verifyToken, requireAdmin, list);
router.get("/:id", verifyToken, requireAdmin, getById);
router.patch("/:id/approve", verifyToken, requireAdmin, approve);
router.patch("/:id/reject", verifyToken, requireAdmin, reject);

export default router;
