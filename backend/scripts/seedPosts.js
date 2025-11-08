import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import MarketPost from '../models/Post.js';
import samples from '../data/samplePosts.js';

// Simple seed script for posts
async function run() {
  await connectDB();
  console.log('Connected. Seeding posts...');
  let created = 0;
  for (const s of samples) {
    const filter = { title: s.title, phone: s.phone };
    const exists = await MarketPost.findOne(filter).lean();
    if (!exists) {
      // create a fake user for each sample post
      const nu = await User.create({ username: `post-demo-${Date.now()}`, email: `post-demo-${Date.now()}@example.com`, provider: 'google', isVerified: true });
      const toCreate = { ...s, userId: nu._id };
      await MarketPost.create(toCreate);
      created++;
    }
  }
  console.log(`Seed finished. Created ${created} new posts.`);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
