import express from "express";
import {
  createFarmingModel,
  listFarmingModel,
  getFarmingModelById,
  softDeleteFarmingModel,
  restoreFarmingModel,
} from "../controllers/farmingController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// BẮT BUỘC: gắn protect trước khi dùng các route phía dưới
router.use(protect);

router.post("/plan", createFarmingModel);
router.get("/plans", listFarmingModel);
router.get("/plans/:id", getFarmingModelById);
router.delete("/plans/:id", softDeleteFarmingModel);
router.patch("/plans/:id/restore", restoreFarmingModel);

export default router;
