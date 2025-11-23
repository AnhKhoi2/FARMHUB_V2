import "dotenv/config";
import { connectDB } from "../config/db.js";
import Guide from "../models/Guide.js";

async function run() {
  await connectDB();
  console.log('✅ Connected');
  const sample = await Guide.find({ deleted: false }).sort({ updatedAt: -1 }).limit(10).select('title plant_name plant_group plantTags tags updatedAt').lean();
  console.log(JSON.stringify(sample, null, 2));
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
