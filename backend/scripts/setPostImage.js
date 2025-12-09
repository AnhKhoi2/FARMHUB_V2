import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MarketPost from '../models/Post.js';

// Load .env from backend folder if present
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/farmhub';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node setPostImage.js <postId> <imagePath>');
    console.error('Example: node setPostImage.js 693057817c82c3d931e853e3 /uploads/market/2.webp');
    process.exit(2);
  }
  const [postId, imagePath] = args;

  try {
    console.log('Connecting to', MONGO);
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

    const post = await MarketPost.findById(postId);
    if (!post) {
      console.error('Post not found:', postId);
      process.exit(3);
    }

    // Backup existing images in console for manual record
    console.log('Current images:', post.images);

    post.images = Array.isArray(post.images) ? [imagePath] : [imagePath];
    await post.save();

    console.log('Updated post.images ->', post.images);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    try { await mongoose.disconnect(); } catch(e){}
    process.exit(1);
  }
}

main();
