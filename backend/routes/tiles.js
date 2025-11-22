// routes/tiles.js
import { Router } from 'express';
import { getTileController } from '../controllers/tilesController.js';

const r = Router();

/**
 * GET /api/ow/tiles/:layer/:z/:x/:y.png
 */
r.get('/:layer/:z/:x/:y.png', getTileController);

export default r;
