import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import Notebook from "../models/Notebook.js";
import PlantTemplate from "../models/PlantTemplate.js";
import { getVietnamToday, toVietnamMidnight } from "../utils/timezone.js";

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
    let notebook = await Notebook.findById(id).populate("template_id");
    if (!notebook) {
      console.error("Notebook not found", id);
      process.exit(1);
    }

    // Ensure daily checklist exists
    // We can't import generateDailyChecklist easily here without risk of double imports, but
    // we'll assume daily_checklist exists (we ran runGenerate earlier). If not, this script
    // will still operate on current daily_checklist.

    const currentStageTracking = notebook.stages_tracking.find(
      (s) => s.stage_number === notebook.current_stage
    );
    if (!currentStageTracking) {
      console.error("No current stage tracking found");
      process.exit(1);
    }

    const today = getVietnamToday();
    const todayStr = today.toISOString().split("T")[0];

    const todayTasks = notebook.daily_checklist || [];
    let completedCount = 0;
    for (const t of todayTasks) {
      if (!t.is_completed) {
        t.is_completed = true;
        t.completed_at = new Date();
        t.status = "completed";
      }
      if (t.is_completed) completedCount++;

      // ensure completed_tasks contains the entry
      if (!currentStageTracking.completed_tasks)
        currentStageTracking.completed_tasks = [];
      const already = currentStageTracking.completed_tasks.some(
        (c) =>
          c.task_name === t.task_name &&
          toVietnamMidnight(new Date(c.completed_at)).toISOString() ===
            toVietnamMidnight(new Date()).toISOString()
      );
      if (!already) {
        currentStageTracking.completed_tasks.push({
          task_name: t.task_name,
          completed_at: new Date(),
        });
      }
    }

    // Ensure daily_logs has today's entry
    if (!currentStageTracking.daily_logs) currentStageTracking.daily_logs = [];
    let dailyLog = currentStageTracking.daily_logs.find(
      (log) => log.date?.toISOString().split("T")[0] === todayStr
    );
    if (!dailyLog) {
      dailyLog = { date: today, daily_progress: 0 };
      currentStageTracking.daily_logs.push(dailyLog);
    }

    const totalToday = todayTasks.length || 0;
    if (totalToday > 0) {
      dailyLog.daily_progress = Math.round((completedCount / totalToday) * 100);
    }

    // Recompute progress
    await notebook.updateProgress(notebook.template_id?.stages || []);

    await notebook.save();

    console.log("Marked today tasks completed.");
    console.log("Notebook progress now:", notebook.progress);
    const st = notebook.stages_tracking.find(
      (s) => s.stage_number === notebook.current_stage
    );
    console.log(
      "Stage completion (getCurrentStageCompletion):",
      await notebook.getCurrentStageCompletion()
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
