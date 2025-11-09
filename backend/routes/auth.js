// backend/src/routes/auth.js
import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";


const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// Yêu cầu reset (body: {email})
router.post("/password/forgot", authController.requestPasswordReset); 
// Đặt lại mật khẩu (params: :token, body: {newPassword})
router.post("/password/reset/:token", authController.resetPassword);

router.get("/verify/:token", authController.verifyEmail);
router.get("/me", verifyToken, authController.me);


router.put("/password/change", verifyToken, authController.changePassword);
router.post("/google", authController.loginWithGoogle);
router.put("/password/set", verifyToken, authController.setPassword);

export default router;
