import express from 'express';
import weatherController from '../controllers/weatherController.js';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /admin/weather?q=Hanoi
router.get('/', verifyToken, requireAdmin, weatherController.getCurrent);

export default router;
