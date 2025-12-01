#!/usr/bin/env node
// Convert Expert.user stored as string into ObjectId when possible
// Usage: node scripts/migrations/convertExpertUserIdsToObjectId.js --dry

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Expert from '../../models/Expert.js';
import User from '../../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry');

const MONGO = process.env.MONGO_URI || process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/farmhub';

async function run() {
  console.log('Connect to', MONGO);
  await mongoose.connect(MONGO, { dbName: process.env.DB_NAME || undefined });

  try {
    // Find Experts where user is a string that looks like an ObjectId
    const candidates = await Expert.find({}).lean();

    let toFix = [];
    for (const ex of candidates) {
      const u = ex.user;
      if (typeof u === 'string' && mongoose.Types.ObjectId.isValid(u)) {
        // check if there is a matching User
        const mapped = await User.findById(u).lean();
        if (mapped) toFix.push({ expertId: ex._id, userString: u });
      }
    }

    console.log(`Found ${toFix.length} Expert docs with string user id that can be converted.`);
    if (toFix.length === 0) {
      console.log('Nothing to do. Exiting.');
      process.exit(0);
    }

    if (dryRun) {
      console.log('Dry run mode - listing samples (up to 20):');
      console.table(toFix.slice(0, 20));
      process.exit(0);
    }

    console.log('Updating documents...');
    let updated = 0;
    for (const item of toFix) {
      const result = await Expert.updateOne(
        { _id: item.expertId },
        { $set: { user: new mongoose.Types.ObjectId(item.userString) } }
      );
      if (result.modifiedCount > 0) updated++;
      console.log(`Expert ${item.expertId} -> user ${item.userString} updated:`, result.modifiedCount);
    }

    console.log(`Migration finished. Updated ${updated}/${toFix.length} documents.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
