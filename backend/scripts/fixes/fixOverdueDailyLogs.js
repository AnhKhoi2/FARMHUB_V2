import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import Notebook from "../models/Notebook.js";
import PlantTemplate from "../models/PlantTemplate.js";
import { toVietnamMidnight } from "../utils/timezone.js";

dotenv.config({ path: path.join(process.cwd(), ".env") });
const MONGO = process.env.MONGODB_CONNECTIONSTRING || process.env.MONGODB_URI;
if (!MONGO) {
  console.error("Missing MongoDB URI");
  process.exit(1);
}

const id = process.argv[2];
if (!id) {
  console.error("Notebook id required");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(MONGO);
  try {
    const notebook = await Notebook.findById(id).populate("template_id");
    if (!notebook) {
      console.error("Notebook not found", id);
      process.exit(1);
    }

    const currentStageTracking = notebook.stages_tracking.find(
      (s) => s.stage_number === notebook.current_stage
    );
    if (!currentStageTracking) {
      console.error("No current stage tracking found");
      process.exit(1);
    }

    if (
      !currentStageTracking.overdue_tasks ||
      currentStageTracking.overdue_tasks.length === 0
    ) {
      console.log("No overdue tasks present, nothing to fix");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Group overdue tasks by original_date (normalized)
    const groups = {};
    for (const ot of currentStageTracking.overdue_tasks) {
      if (!ot.original_date) continue;
      const key = toVietnamMidnight(new Date(ot.original_date))
        .toISOString()
        .split("T")[0];
      groups[key] = groups[key] || [];
      groups[key].push(ot);
    }

    if (!currentStageTracking.daily_logs) currentStageTracking.daily_logs = [];

    for (const key of Object.keys(groups)) {
      const related = groups[key];
      const completedCount = related.filter(
        (r) => r.status === "completed"
      ).length;
      const totalCount = related.length || 1;
      let log = currentStageTracking.daily_logs.find(
        (l) =>
          toVietnamMidnight(new Date(l.date)).toISOString().split("T")[0] ===
          key
      );
      if (!log) {
        log = {
          date: toVietnamMidnight(new Date(related[0].original_date)),
          daily_progress: 0,
        };
        currentStageTracking.daily_logs.push(log);
      }
      log.daily_progress = Math.round((completedCount / totalCount) * 100);
      console.log(
        `Set daily_log for ${key} => ${log.daily_progress}% (completed ${completedCount}/${totalCount})`
      );
    }

    // Recalculate progress
    await notebook.updateProgress(notebook.template_id?.stages || []);
    await notebook.save();

    console.log("Updated notebook progress:", notebook.progress);
    const st = notebook.stages_tracking.find(
      (s) => s.stage_number === notebook.current_stage
    );
    console.log("Stage daily_logs:", st.daily_logs);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
