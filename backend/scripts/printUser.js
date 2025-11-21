import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

async function main() {
  const username = process.argv[2] || "danguser11";
  const uri = process.env.MONGODB_CONNECTIONSTRING || process.env.MONGO_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("MongoDB connection string not found in env. Set MONGODB_CONNECTIONSTRING or MONGO_URI in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const user = await User.findOne({ username }).lean();
  if (!user) {
    console.log(`No user found with username: ${username}`);
    process.exit(0);
  }

  // Print selected fields for safety
  const out = {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
