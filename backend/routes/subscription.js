import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/status', verifyToken, subscriptionController.status);

export default router;
