import { Router } from "express";
import { profileController } from "../controllers/profileController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validateUpdateProfile } from "../validations/profile.validator.js";
const router = Router();

router.get("/", verifyToken, profileController.getProfile);
router.put("/", verifyToken, profileController.updateProfile);
// Model suggestion endpoints
router.get('/model-suggestion', verifyToken, profileController.getModelSuggestion);
router.post('/model-suggestion/select', verifyToken, profileController.selectModelSuggestion);
router.post('/model-suggestion/skip', verifyToken, profileController.skipModelSuggestion);

export default router;
