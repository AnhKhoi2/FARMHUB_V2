import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { ok } from '../utils/ApiResponse.js';

// Serve a static JSON list of layout templates for users to reference.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const layoutController = {
  list: (req, res) => {
    try {
      const file = fs.readFileSync(path.join(__dirname, '../data/layouts.json'), 'utf-8');
      const layouts = JSON.parse(file);
      return ok(res, layouts);
    } catch (err) {
      // fallback: return empty array
      return ok(res, []);
    }
  },
};

export default layoutController;
