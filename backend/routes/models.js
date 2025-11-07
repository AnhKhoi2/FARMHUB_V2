import express from 'express';
import { modelController } from '../controllers/modelController.js';

const router = express.Router();

router.get('/', modelController.list);
router.get('/trash', modelController.trash);
router.post('/', modelController.create);
router.get('/:id', modelController.detail);
router.put('/:id', modelController.update);
router.delete('/:id', modelController.softDelete);
router.patch('/:id/hide', modelController.hide);
router.patch('/:id/restore', modelController.restore);

export default router;
