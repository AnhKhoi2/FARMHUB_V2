import { Router } from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/vnpay/create', verifyToken, paymentController.createVNPay);
router.get('/vnpay/return', paymentController.vnpayReturn);
router.get('/history', verifyToken, paymentController.history);

export default router;
