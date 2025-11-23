import dotenv from "dotenv";
import path from "path";
import { connectDB } from "../config/db.js";
import Notebook from "../models/Notebook.js";
import { generateDailyChecklist } from "../controllers/notebookController.js";
import { getVietnamToday, toVietnamMidnight } from "../utils/timezone.js";

// Load backend/.env if needed
if (!process.env.MONGODB_CONNECTIONSTRING) {
  const envPath = path.join(process.cwd(), "backend", ".env");
  dotenv.config({ path: envPath });
}

async function run() {
  await connectDB();

  const notebookId = "6922cd825b4abdc3f2997e73"; // Húng quế 3
  console.log(`\n📓 Testing notebook: ${notebookId}`);

  // Fetch notebook
  let notebook = await Notebook.findById(notebookId).populate("template_id");
  if (!notebook) {
    console.error("Notebook not found!");
    process.exit(1);
  }

  console.log(
    `\n📅 Planted date: ${notebook.planted_date.toISOString().split("T")[0]}`
  );
  console.log(
    `📅 Today (VN): ${getVietnamToday().toISOString().split("T")[0]}`
  );
  console.log(`📊 Current stage: ${notebook.current_stage}`);
  console.log(`📊 Current day: ${notebook.current_day}`);
  console.log(`📊 Progress: ${notebook.progress}%`);

  // Show current stage tracking
  const currentStageTracking = notebook.stages_tracking.find(
    (s) => s.stage_number === notebook.current_stage
  );

  if (currentStageTracking) {
    console.log(`\n🔍 Current Stage Tracking:`);
    console.log(
      `   Stage: ${currentStageTracking.stage_number} - ${currentStageTracking.stage_name}`
    );
    console.log(`   Status: ${currentStageTracking.status}`);
    console.log(
      `   Started at: ${
        currentStageTracking.started_at?.toISOString().split("T")[0] || "N/A"
      }`
    );
    console.log(
      `   Completed tasks: ${currentStageTracking.completed_tasks?.length || 0}`
    );

    if (currentStageTracking.completed_tasks?.length) {
      console.log(`   Completed task details:`);
      currentStageTracking.completed_tasks.forEach((t) => {
        console.log(
          `      - ${t.task_name} (completed: ${
            t.completed_at?.toISOString().split("T")[0]
          })`
        );
      });
    }

    console.log(
      `   Overdue tasks: ${currentStageTracking.overdue_tasks?.length || 0}`
    );
    if (currentStageTracking.overdue_tasks?.length) {
      console.log(`   Overdue task details:`);
      currentStageTracking.overdue_tasks.forEach((t) => {
        console.log(
          `      - ${t.task_name} (original: ${
            t.original_date?.toISOString().split("T")[0]
          }, status: ${t.status})`
        );
      });
    }
  }

  console.log(
    `\n📝 Current daily_checklist (before regenerate): ${notebook.daily_checklist.length} tasks`
  );
  notebook.daily_checklist.forEach((t, i) => {
    console.log(
      `   ${i + 1}. ${t.task_name} - ${
        t.is_completed ? "✅ Completed" : "⏳ Pending"
      } (freq: ${t.frequency})`
    );
  });

  // Force regenerate checklist
  console.log(`\n🔄 Regenerating daily checklist...`);

  // Reset last_checklist_generated to force regeneration
  notebook.last_checklist_generated = null;
  await notebook.save();

  const newChecklist = await generateDailyChecklist(notebookId);

  // Reload notebook to see changes
  notebook = await Notebook.findById(notebookId).populate("template_id");

  console.log(
    `\n✅ NEW daily_checklist (after regenerate): ${notebook.daily_checklist.length} tasks`
  );
  notebook.daily_checklist.forEach((t, i) => {
    console.log(
      `   ${i + 1}. ${t.task_name} - ${
        t.is_completed ? "✅ Completed" : "⏳ Pending"
      } (freq: ${t.frequency})`
    );
  });

  console.log(
    `\n📊 Test completed! Check if daily tasks appear as PENDING for today.`
  );
  process.exit(0);
}

run().catch((err) => {
  console.error("Error testing notebook:", err);
  process.exit(1);
});
