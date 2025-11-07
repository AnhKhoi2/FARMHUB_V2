import { Router } from "express";
import * as ctrl from "../controllers/expertController.js";

const router = Router();
router.get("/", ctrl.list);
router.get("/:id", ctrl.getById);
router.delete("/:id", ctrl.remove);

export default router;
