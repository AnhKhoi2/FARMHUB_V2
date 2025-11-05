import fs from 'fs';
import path from 'path';
const p = path.resolve('./utils/ApiResponse.js');
console.log('RESOLVED PATH:', p);
console.log('FILE STAT:', fs.existsSync(p), fs.statSync(p));
console.log('RAW CONTENT:\n', fs.readFileSync(p, 'utf8'));

import * as api from './utils/ApiResponse.js';
console.log('EXPORT KEYS:', Object.keys(api));
console.log('EXPORTS:', api);
