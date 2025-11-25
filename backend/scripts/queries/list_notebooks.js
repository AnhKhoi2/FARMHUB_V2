import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { connectDB } from "../config/db.js";
import Notebook from "../models/Notebook.js";
import User from "../models/User.js";
import PlantTemplate from "../models/PlantTemplate.js";

// Load backend/.env if needed
if (!process.env.MONGODB_CONNECTIONSTRING) {
  const envPath = path.join(process.cwd(), "backend", ".env");
  dotenv.config({ path: envPath });
}

async function run() {
  await connectDB();

  // Fetch notebooks (limit to 500 to avoid huge output)
  const limit = parseInt(process.argv[2], 10) || 200;
  const notebooks = await Notebook.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("user_id", "username email")
    .populate("template_id", "template_name plant_group")
    .lean();

  const output = notebooks.map((nb) => ({
    _id: nb._id,
    notebook_name: nb.notebook_name,
    user: nb.user_id
      ? {
          _id: nb.user_id._id,
          username: nb.user_id.username,
          email: nb.user_id.email,
        }
      : null,
    plant_type: nb.plant_type,
    plant_group: nb.plant_group,
    template: nb.template_id
      ? { _id: nb.template_id._id, template_name: nb.template_id.template_name }
      : null,
    planted_date: nb.planted_date,
    current_stage: nb.current_stage,
    progress: nb.progress,
    daily_checklist_count: Array.isArray(nb.daily_checklist)
      ? nb.daily_checklist.length
      : 0,
    status: nb.status,
    createdAt: nb.createdAt,
    updatedAt: nb.updatedAt,
  }));

  // Ensure tmp dir
  const tmpDir = path.join(process.cwd(), "backend", "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const outPath = path.join(tmpDir, `notebooks_list_${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");

  console.log(`Wrote ${output.length} notebooks to ${outPath}`);
  // Print first 5 for quick view
  console.log(JSON.stringify(output.slice(0, 5), null, 2));

  process.exit(0);
}

run().catch((err) => {
  console.error("Error listing notebooks:", err);
  process.exit(1);
});
