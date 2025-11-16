import "dotenv/config";
import mongoose from "mongoose";

import User from "../models/User.js";
import Expert from "../models/Expert.js";

const usernameArg = process.argv[2] || "testuser"; // change default as needed

async function main() {
  const uri = process.env.MONGODB_CONNECTIONSTRING || process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGODB_CONNECTIONSTRING not set. Check your .env");
    process.exit(1);
  }
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
  console.log("Connected to MongoDB");

  // case-insensitive username search
  const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  const usernameQuery = { username: { $regex: `^${escapeRegExp(usernameArg)}$`, $options: "i" } };

  const user = await User.findOne(usernameQuery).lean();
  if (!user) {
    console.log(`User with username=${usernameArg} not found`);
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log("User found:", {
    _id: user._id,
    username: user.username,
    email: user.email,
    provider: user.provider,
    role: user.role,
    isVerified: user.isVerified,
    isBanned: user.isBanned,
    // show a prefix of the password hash so we can tell if it's a bcrypt hash (e.g. starts with $2b$)
    password_preview: user.password ? String(user.password).slice(0, 20) : null,
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

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  mongoose.disconnect().finally(() => process.exit(1));
});
