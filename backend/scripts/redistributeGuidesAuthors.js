import "dotenv/config";
import { connectDB } from "../config/db.js";
import Guide from "../models/Guide.js";
import User from "../models/User.js";

/**
 * Redistribute authors among all users with role = 'expert'.
 * Usage: node backend/scripts/redistributeGuidesAuthors.js
 */

async function run() {
  await connectDB();
  console.log("✅ Connected to MongoDB");

  let experts = await User.find({ role: "expert" }).lean();
  if (!experts || experts.length === 0) {
    const admin = await User.findOne({ role: "admin" }).lean();
    if (admin) experts = [admin];
  }

  if (!experts || experts.length === 0) {
    console.error("❌ No expert or admin users found. Create at least one expert/admin first.");
    process.exit(1);
  }

  console.log(`🧑‍🌾 Found ${experts.length} author(s). Redistributing guides among them.`);

  // Fetch guides to update (only non-deleted)
  const guides = await Guide.find({ deleted: false }).sort({ createdAt: 1 }).lean();
  if (!guides || guides.length === 0) {
    console.log("No guides found to redistribute.");
    process.exit(0);
  }

  const bulkOps = [];
  for (let i = 0; i < guides.length; i++) {
    const guide = guides[i];
    const assigned = experts[i % experts.length];
    // Only update if different
    if (!guide.expert_id || String(guide.expert_id) !== String(assigned._id)) {
      bulkOps.push({
        updateOne: {
          filter: { _id: guide._id },
          update: { $set: { expert_id: assigned._id } },
        },
      });
    }
  }

  if (bulkOps.length === 0) {
    console.log("All guides already assigned appropriately. No changes needed.");
  } else {
    console.log(`Applying ${bulkOps.length} updates...`);
    const res = await Guide.bulkWrite(bulkOps, { ordered: false });
    console.log("Bulk write result:", res.result || res);
  }

  // Show distribution after update
  const dist = await Guide.aggregate([
    { $match: { deleted: false } },
    { $group: { _id: "$expert_id", count: { $sum: 1 } } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, expert_id: "$_id", username: "$user.username", count: 1 } },
  ]);

  console.table(dist);

  console.log("✅ Redistribution complete.");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
