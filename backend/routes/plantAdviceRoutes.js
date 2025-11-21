// routes/plantAdviceRoutes.js
import express from "express";
import { getPlantAdviceController } from "../controllers/plantAdviceController.js";

const router = express.Router();

router.get("/gardening/advice", getPlantAdviceController);

export default router;
