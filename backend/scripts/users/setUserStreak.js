#!/usr/bin/env node
// setUserStreak.js
// Usage:
// node scripts/setUserStreak.js --mongoUri mongodb://... --userId <userId> --total 10 --current 6 --max 6 --badges mam-non,cay-con --lastOffset 0

import mongoose from 'mongoose';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import UserStreak from '../models/UserStreak.js';

const argv = yargs(hideBin(process.argv))
  .option('mongoUri', { type: 'string', describe: 'MongoDB URI' })
  .option('userId', { type: 'string', demandOption: true, describe: 'User ObjectId' })
  .option('total', { type: 'number', default: 0, describe: 'total_points' })
  .option('current', { type: 'number', default: 0, describe: 'current_streak' })
  .option('max', { type: 'number', default: 0, describe: 'max_streak' })
  .option('badges', { type: 'string', default: '', describe: 'comma-separated earned_badges slugs' })
  .option('lastOffset', { type: 'number', default: 0, describe: 'last_login_date offset in days from today (0 = today, -1 = yesterday)' })
  .help()
  .argv;

const MONGO_URI = argv.mongoUri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/farmhub';

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  return d;
}

async function main(){
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', MONGO_URI);

  const userId = argv.userId;
  const total = Number(argv.total) || 0;
  const current = Number(argv.current) || 0;
  const max = Number(argv.max) || 0;
  const badges = argv.badges ? argv.badges.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const lastOffset = Number(argv.lastOffset) || 0;

  const lastDate = startOfDay(new Date(Date.now() + lastOffset * 24 * 60 * 60 * 1000));

  const doc = {
    user: userId,
    current_streak: current,
    max_streak: max,
    last_login_date: lastDate,
    total_points: total,
    earned_badges: badges,
  };

  // upsert
  const res = await UserStreak.findOneAndUpdate({ user: userId }, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
  console.log('UserStreak updated:', JSON.stringify(res, null, 2));

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err=>{ console.error(err); process.exit(1); });
