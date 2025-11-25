import dotenv from "dotenv";
import path from "path";
import { connectDB } from "../config/db.js";
import PlantTemplate from "../models/PlantTemplate.js";

// Ensure env is loaded: prefer existing env, otherwise load backend/.env
if (!process.env.MONGODB_CONNECTIONSTRING) {
  const envPath = path.join(process.cwd(), "backend", ".env");
  dotenv.config({ path: envPath });
}

async function run() {
  await connectDB();

  // Search strategies: template_name regex, plant_examples contains, plant_group herb
  const regex = { $regex: /hung|húng|basil/i };

  const byName = await PlantTemplate.find({ template_name: regex }).lean();
  const byExamples = await PlantTemplate.find({
    plant_examples: { $in: [/Húng quế/i, /hung/i, /basil/i] },
  }).lean();
  const byGroup = await PlantTemplate.find({ plant_group: "herb" }).lean();

  const uniq = (arr) => (arr || []).map((d) => d._id.toString());
  const ids = new Set([...uniq(byName), ...uniq(byExamples), ...uniq(byGroup)]);

  const results = [];
  const fullDetails = [];
  for (const id of ids) {
    const doc = await PlantTemplate.findById(id).lean();
    if (doc) {
      // Print compact info
      results.push({
        _id: doc._id,
        template_name: doc.template_name,
        plant_group: doc.plant_group,
        plant_examples: doc.plant_examples,
        status: doc.status,
        stages_count: doc.stages ? doc.stages.length : 0,
        total_days:
          doc.stages && doc.stages.length
            ? Math.max(...doc.stages.map((s) => s.day_end))
            : 0,
      });

      // Also collect full document for inspection
      fullDetails.push(doc);
    }
  }

  console.log(
    JSON.stringify(
      { found: results.length, results, full_details: fullDetails },
      null,
      2
    )
  );
  process.exit(0);
}

run().catch((err) => {
  console.error("Error inspecting basil templates:", err);
  process.exit(1);
});
