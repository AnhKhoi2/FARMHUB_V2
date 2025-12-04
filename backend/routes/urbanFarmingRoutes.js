import express from "express";
import {
  createUrbanFarmingPlan,
  listUrbanFarmingPlans,
  getUrbanFarmingPlanById,
  softDeleteUrbanFarmingPlan,
  restoreUrbanFarmingPlan,
} from "../controllers/urbanFarmingController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// BẮT BUỘC: gắn protect trước khi dùng các route phía dưới
router.use(protect);

router.post("/plan", createUrbanFarmingPlan);
router.get("/plans", listUrbanFarmingPlans);
router.get("/plans/:id", getUrbanFarmingPlanById);
router.delete("/plans/:id", softDeleteUrbanFarmingPlan);
router.patch("/plans/:id/restore", restoreUrbanFarmingPlan);

export default router;
