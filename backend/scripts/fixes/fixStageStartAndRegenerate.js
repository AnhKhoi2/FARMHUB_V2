// Script: fixStageStartAndRegenerate.js
// Usage: node --experimental-specifier-resolution=node scripts/fixStageStartAndRegenerate.js <notebookId>

import mongoose from "mongoose";
import dotenv from "dotenv";
import Notebook from "../models/Notebook.js";
import { getVietnamToday, toVietnamMidnight } from "../utils/timezone.js";
import { generateDailyChecklist } from "../controllers/notebookController.js";

dotenv.config();

const run = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_CONNECTIONSTRING ||
      process.env.MONGODB_URI ||
      process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("No MongoDB URI found in environment.");
      process.exit(1);
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const notebookId = process.argv[2];
    if (!notebookId) {
      console.error("Please provide notebookId as first argument");
      process.exit(1);
    }

    const notebook = await Notebook.findById(notebookId);
    if (!notebook) {
      console.error("Notebook not found", notebookId);
      process.exit(1);
    }

    const stageNumber = notebook.current_stage;
    const stIdx = notebook.stages_tracking.findIndex(
      (s) => s.stage_number === stageNumber
    );
    if (stIdx === -1) {
      console.error("Current stage tracking not found for stage", stageNumber);
      process.exit(1);
    }

    // Compute template-planned start date for the current stage (planted_date + day_start - 1)
    await notebook.populate("template_id");
    const templateStage = notebook.template_id?.stages?.find(
      (s) => s.stage_number === stageNumber
    );
    let plannedStart = null;
    if (templateStage) {
      plannedStart = new Date(notebook.planted_date);
      plannedStart.setDate(
        plannedStart.getDate() + templateStage.day_start - 1
      );
      plannedStart = toVietnamMidnight(plannedStart);
      console.log(
        "Setting stage started_at to template-planned start:",
        plannedStart.toISOString()
      );
      notebook.stages_tracking[stIdx].started_at = plannedStart;
    } else {
      const today = getVietnamToday();
      console.log(
        "Template stage not found; falling back to VN day-start:",
        today.toISOString()
      );
      notebook.stages_tracking[stIdx].started_at = today;
    }
    // Reset last_checklist_generated so generateDailyChecklist will run
    notebook.last_checklist_generated = null;
    // Clear daily_checklist so new generation populates fresh
    notebook.daily_checklist = [];

    await notebook.save();
    console.log("Notebook updated. Now regenerating checklist...");

    const newChecklist = await generateDailyChecklist(notebook._id.toString());

    console.log(
      "New checklist length:",
      Array.isArray(newChecklist) ? newChecklist.length : "null"
    );
    console.log("Checklist items:");
    (newChecklist || []).forEach((t, i) =>
      console.log(`  ${i + 1}. ${t.task_name} | freq=${t.frequency}`)
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
};

run();
