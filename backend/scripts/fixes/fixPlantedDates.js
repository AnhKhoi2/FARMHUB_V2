import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import Notebook from "../models/Notebook.js";
import PlantTemplate from "../models/PlantTemplate.js";
import { toVietnamMidnight, getVietnamToday } from "../utils/timezone.js";

dotenv.config({ path: path.join(process.cwd(), ".env") });
const MONGO = process.env.MONGODB_CONNECTIONSTRING || process.env.MONGODB_URI;
if (!MONGO) {
  console.error("Missing MongoDB URI");
  process.exit(1);
}

const daysBack = parseInt(process.argv[2] || "7", 10);

const run = async () => {
  await mongoose.connect(MONGO);
  try {
    const today = getVietnamToday();
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - daysBack);

    const docs = await Notebook.find({ createdAt: { $gte: fromDate } }).limit(
      500
    );
    console.log(
      `Scanning ${docs.length} notebooks created since ${
        toVietnamMidnight(fromDate).toISOString().split("T")[0]
      }`
    );

    let fixed = 0;
    for (const nb of docs) {
      const createdVN = toVietnamMidnight(new Date(nb.createdAt));
      const plantedVN = nb.planted_date
        ? toVietnamMidnight(new Date(nb.planted_date))
        : null;
      if (!plantedVN) continue;
      const dayDiff = (createdVN - plantedVN) / (1000 * 60 * 60 * 24);
      if (dayDiff > 0) {
        console.log(`Fixing ${nb._id}: planted earlier by ${dayDiff} day(s)`);
        // Set planted_date to notebook's VN creation day
        nb.planted_date = createdVN;

        // If stages_tracking present and template available, recalc started_at
        if (nb.stages_tracking && nb.stages_tracking.length > 0) {
          for (const st of nb.stages_tracking) {
            if (typeof st.stage_number === "number") {
              // Find corresponding template stage to get day_start
              let template = null;
              if (nb.template_id)
                template = await PlantTemplate.findById(nb.template_id);
              const tmplStage = template?.stages?.find(
                (s) => s.stage_number === st.stage_number
              );
              const dayStart = tmplStage ? tmplStage.day_start : 1;
              const startDate = new Date(nb.planted_date);
              startDate.setDate(startDate.getDate() + dayStart - 1);
              st.started_at = toVietnamMidnight(startDate);
            }
          }
        }

        // Recalculate progress if possible
        try {
          await nb.updateProgress(
            (await PlantTemplate.findById(nb.template_id))?.stages || []
          );
        } catch (e) {
          console.warn("Failed to update progress for", nb._id, e.message);
        }

        await nb.save();
        fixed++;
      }
    }

    console.log(`Fixed ${fixed} notebooks.`);
  } catch (e) {
    console.error("Error", e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
