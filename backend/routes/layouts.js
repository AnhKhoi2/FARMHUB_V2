import express from 'express';
import { layoutController } from '../controllers/layoutController.js';

const router = express.Router();

// GET /layouts - return available layout templates
router.get('/', layoutController.list);

export default router;
