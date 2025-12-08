import express from "express";
import { getPesticideInfoByAi } from "../controllers/pesticideInfoController.js";

const router = express.Router();
import { protect } from "../middlewares/authMiddleware.js";
// POST /api/pesticides/ai-info
router.use(protect);
router.post("/ai-info", getPesticideInfoByAi);

export default router;
