import "dotenv/config";
import { connectDB } from "../config/db.js";
import Guide from "../models/Guide.js";

async function run() {
  await connectDB();
  console.log('✅ Connected to MongoDB');

  const filter = { deleted: { $ne: true }, $or: [ { category: { $exists: false } }, { category: '' } ] };
  const total = await Guide.countDocuments(filter);
  console.log(`Found ${total} guides with missing/empty category`);

  const docs = await Guide.find(filter).limit(200).lean();
  if (!docs.length) {
    console.log('No guides missing category.');
    process.exit(0);
  }

  // print concise list
  const out = docs.map(d => ({ _id: d._id, title: d.title, plant_name: d.plant_name, plant_group: d.plant_group, tags: d.tags || [], plantTags: d.plantTags || [], category: d.category }));
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
