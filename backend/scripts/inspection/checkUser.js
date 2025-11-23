import "dotenv/config";
import mongoose from "mongoose";

import User from "../models/User.js";
import Expert from "../models/Expert.js";

const email = process.argv[2] || "nyvqca160899@fpt.edu.vn";

async function main() {
  const uri = process.env.MONGODB_CONNECTIONSTRING || process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGODB_CONNECTIONSTRING not set. Check your .env");
    process.exit(1);
  }
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
  console.log("Connected to MongoDB");

  const user = await User.findOne({ email }).lean();
  if (!user) {
    console.log(`User with email=${email} not found`);
    process.exit(0);
  }
  console.log("User found:", {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    isBanned: user.isBanned,
    provider: user.provider,
  });

  const expert = await Expert.findOne({ user: user._id }).lean();
  if (!expert) {
    console.log("No Expert profile linked to this user.");
  } else {
    console.log("Expert profile:", {
      expert_id: expert.expert_id,
      full_name: expert.full_name,
      review_status: expert.review_status,
    });
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
