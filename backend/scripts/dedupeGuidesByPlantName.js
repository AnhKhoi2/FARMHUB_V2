import "dotenv/config";
import { connectDB } from "../config/db.js";
import Guide from "../models/Guide.js";

/**
 * List duplicate guides by `plant_name` and optionally delete duplicates keeping the earliest created one.
 * Usage:
 *  - List only: node scripts/dedupeGuidesByPlantName.js
 *  - Delete duplicates (non-recoverable): node scripts/dedupeGuidesByPlantName.js --delete
 */

const args = process.argv.slice(2);
const doDelete = args.includes("--delete");

async function run() {
  await connectDB();
  console.log("✅ Connected to MongoDB");

  // Aggregate by plant_name (case-insensitive trim) to find duplicates
  const groups = await Guide.aggregate([
    { $match: { deleted: false, plant_name: { $exists: true, $ne: null } } },
    { $project: { plant_name: { $trim: { input: { $toLower: "$plant_name" } } }, title: 1, createdAt: 1 } },
    { $group: { _id: "$plant_name", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } }
  ]);

  if (!groups || groups.length === 0) {
    console.log("No duplicate plant_name found.");
    process.exit(0);
  }

  console.log(`Found ${groups.length} plant_name(s) with duplicates:`);
  for (const g of groups) {
    console.log(`- '${g._id}' -> ${g.count} guides`);
  }

  // Show detailed entries for each duplicate group
  for (const g of groups) {
    console.log(`\n=== Group: '${g._id}' (${g.count}) ===`);
    const docs = await Guide.find({ deleted: false }).or([{ plant_name: new RegExp(`^${escapeRegExp(g._id)}$`, 'i') }, { plant_name: { $regex: `^${escapeRegExp(g._id)}$`, $options: 'i' } }]).sort({ createdAt: 1 }).lean();
    for (const d of docs) {
      console.log(`* _id: ${d._id} | title: ${d.title || ''} | plant_name: ${d.plant_name} | expert_id: ${d.expert_id || ''} | createdAt: ${d.createdAt}`);
    }

    if (doDelete) {
      // Keep the earliest (first in docs) and delete others (soft-delete by setting deleted=true and deletedAt)
      const keep = docs[0];
      const remove = docs.slice(1).map(x => x._id);
      if (remove.length > 0) {
        const res = await Guide.updateMany({ _id: { $in: remove } }, { $set: { deleted: true, deletedAt: new Date() } });
        console.log(`  -> Marked ${res.modifiedCount || res.nModified || 0} as deleted (kept ${keep._id}).`);
      }
    }
  }

  if (!doDelete) {
    console.log(`\nRun with --delete to soft-delete duplicates (keep earliest created per name).`);
  }

  process.exit(0);
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
