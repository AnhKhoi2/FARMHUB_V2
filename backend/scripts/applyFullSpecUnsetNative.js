import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO = process.env.MONGODB_CONNECTIONSTRING || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/farmhub_v2';

async function run() {
  try {
    await mongoose.connect(MONGO, { dbName: process.env.MONGODB_DB || undefined });
    console.log('✅ Connected to MongoDB');
    const col = mongoose.connection.db.collection('guides');
    const before = await col.countDocuments({ full_spec: { $exists: true } });
    console.log('Before - count with full_spec:', before);
    const res = await col.updateMany({ full_spec: { $exists: true } }, { $unset: { full_spec: "" } });
    console.log('Update result:', { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount });
    const after = await col.countDocuments({ full_spec: { $exists: true } });
    console.log('After - count with full_spec:', after);
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error applying native unset:', err);
    process.exit(1);
  }
}

run();
