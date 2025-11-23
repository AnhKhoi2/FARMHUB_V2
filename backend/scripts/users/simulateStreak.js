#!/usr/bin/env node
// simulateStreak.js
// Usage: node simulateStreak.js --mongoUri mongodb://... --userId <userId> --days 40 --startOffset 0
// If userId not provided, script will create a temporary userStreak entry for a fake userId.

import mongoose from 'mongoose';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import UserStreak from '../models/UserStreak.js';
import { recordLoginHelper } from '../utils/streakHelpers.js';

const argv = yargs(hideBin(process.argv))
  .option('mongoUri', { type: 'string', demandOption: false, describe: 'MongoDB URI (defaults to env MONGO_URI or mongodb://localhost:27017/farmhub)' })
  .option('userId', { type: 'string', describe: 'Existing user ObjectId to simulate for' })
  .option('days', { type: 'number', default: 40, describe: 'Number of days to simulate' })
  .option('startOffset', { type: 'number', default: 0, describe: 'Start offset in days from today (use negative to simulate past start)' })
  .help()
  .argv;

const MONGO_URI = argv.mongoUri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/farmhub';

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', MONGO_URI);

  let userId = argv.userId;
  let createdTempUser = false;
  if (!userId) {
    // create a synthetic ObjectId (not creating User model) and ensure UserStreak doc is clean
    const { Types } = mongoose;
    userId = new Types.ObjectId().toString();
    createdTempUser = true;
    console.log('No userId provided. Using synthetic userId:', userId);
  }

  // Remove existing streak for this user to start fresh
  await UserStreak.deleteMany({ user: userId });

  const results = [];
  for (let i = 0; i < argv.days; i++) {
    // manipulate system date by setting last_login_date manually in DB before calling helper
    // The helper uses startOfDay(new Date()) which reads real Date(), so to simulate consecutive days
    // we'll temporarily monkeypatch Date.now via global. Simpler: call helper but before each call set
    // the rec.last_login_date to a desired past date so logic computes correctly.

    // We'll simulate by directly manipulating existing record between calls.
    const dayOffset = argv.startOffset + i; // 0 = today, -1 = yesterday, etc.
    const fakeNow = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);

    // To simulate we will override Date.now temporarily
    const realNow = Date.now;
    Date.now = () => fakeNow.getTime();

    const res = await recordLoginHelper(userId);
    results.push({ day: i + 1, date: fakeNow.toISOString().slice(0,10), ...res });

    // restore
    Date.now = realNow;
  }

  console.log('\nSimulation results:\n');
  for (const r of results) {
    console.log(`${r.date} | streak=${r.current_streak} | pointsAwarded=${r.pointsAwarded} | total=${r.total_points} | badges=${(r.badgesAwarded||[]).join(',')}`);
  }

  // show final UserStreak doc
  const final = await UserStreak.findOne({ user: userId }).lean();
  console.log('\nFinal userStreak doc:');
  console.log(JSON.stringify(final, null, 2));

  if (createdTempUser) {
    // cleanup: remove the doc
    await UserStreak.deleteMany({ user: userId });
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
