import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import Model from '../models/Model.js';

dotenv.config();

async function backfill() {
  await connectDB();
  try {
    // Find all models ordered by createdAt and assign displayId sequentially where missing
    const all = await Model.find({}).sort({ createdAt: 1 }).lean();
    let next = 1;
    // If some documents already have displayId, start after the max existing
    const maxDoc = await Model.findOne({}).sort({ displayId: -1 }).select('displayId').lean();
    if (maxDoc && maxDoc.displayId) next = Number(maxDoc.displayId) + 1;

    let updated = 0;
    for (const doc of all) {
      if (!doc.displayId) {
        await Model.findByIdAndUpdate(doc._id, { displayId: next }, { new: true });
        next += 1;
        updated += 1;
      }
    }

    console.log(`Backfill finished. Updated ${updated} documents.`);
  } catch (err) {
    console.error('Backfill error', err);
  } finally {
    process.exit(0);
  }
}

backfill();
