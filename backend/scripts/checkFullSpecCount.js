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
    const count = await mongoose.connection.db.collection('guides').countDocuments({ full_spec: { $exists: true } });
    console.log('Count of guides with full_spec:', count);
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error checking full_spec count:', err);
    process.exit(1);
  }
}

run();
