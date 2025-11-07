import { Router } from "express";
import { profileController } from "../controllers/profileController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validateUpdateProfile } from "../validations/profile.validator.js";
const router = Router();

router.get("/", verifyToken, profileController.getProfile);
router.put("/", verifyToken, validateUpdateProfile, profileController.updateProfile);

export default router;
