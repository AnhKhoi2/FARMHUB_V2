import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import User from "../models/User.js";
import Expert from "../models/Expert.js";

// Usage: node scripts/createExpertUser.js [email] [password] [username]
const email = process.argv[2] || "nyvqca160899@fpt.edu.vn";
const password = process.argv[3] || "Ny@12345";
const username = process.argv[4] || email.split("@")[0];

async function main() {
  const uri = process.env.MONGODB_CONNECTIONSTRING;
  if (!uri) {
    console.error(
      "MONGODB_CONNECTIONSTRING is not set in environment. Please set it in your .env"
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
    console.log("Connected to MongoDB");

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("User already exists:", existing._id.toString());
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashed,
      provider: "local",
      role: "expert",
      isVerified: true,
    });
    console.log("Created User:", user._id.toString());

    const expert = await Expert.create({
      user: user._id,
      full_name: username,
      expertise_area: "General",
    });
    console.log("Created Expert profile:", expert.expert_id);

    console.log("Done. You can now login with the new expert account.");
    process.exit(0);
  } catch (err) {
    console.error("Error creating expert user:", err);
    process.exit(1);
  }
}

main();
