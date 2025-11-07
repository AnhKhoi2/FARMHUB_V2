import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import Model from '../models/Model.js';
import samples from '../data/sampleModels.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  await connectDB();
  try {
    let created = 0;
    for (const s of samples) {
      // Use a simple uniqueness heuristic: area + soil + sunHours + floorMaterial
      const filter = {
        area: s.area,
        soil: s.soil,
        sunHours: s.sunHours,
        floorMaterial: s.floorMaterial,
      };
      const exists = await Model.findOne(filter).lean();
      if (!exists) {
        await Model.create(s);
        created += 1;
      }
    }
    console.log(`Seed finished. Created ${created} new models.`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    process.exit(0);
  }
}

seed();
