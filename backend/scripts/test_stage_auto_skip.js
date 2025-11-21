import mongoose from "mongoose";
import dotenv from "dotenv";

import Notebook from "../models/Notebook.js";
import PlantTemplate from "../models/PlantTemplate.js";
import Notification from "../models/Notification.js";
import { getVietnamToday } from "../utils/timezone.js";
import { checkNotebookStageStatus } from "../controllers/notebookController.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGODB_CONNECTIONSTRING ||
  process.env.MONGO_URL ||
  process.env.MONGO;

const log = (...args) => console.log(new Date().toISOString(), ...args);

const main = async () => {
  const notebookId = process.argv[2];
  if (!notebookId) {
    console.error("Usage: node test_stage_auto_skip.js <notebookId>");
    process.exit(1);
  }

  if (!MONGODB_URI) {
    console.error("No MongoDB URI found in env");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  log("Connected to MongoDB");

  const notebook = await Notebook.findById(notebookId).populate("template_id");
  if (!notebook) {
    console.error("Notebook not found:", notebookId);
    process.exit(1);
  }

  if (!notebook.template_id) {
    console.error("Notebook has no template assigned");
    process.exit(1);
  }

  const template = notebook.template_id;
  const today = getVietnamToday();

  const currentStageNumber = notebook.current_stage || 1;
  const templateStage = template.stages.find(
    (s) => s.stage_number === currentStageNumber
  );
  if (!templateStage) {
    console.error(
      "Template stage not found for current stage",
      currentStageNumber
    );
    process.exit(1);
  }

  const safeDelay = template.rules?.safe_delay_days ?? 2;
  log(`Template safe_delay_days = ${safeDelay}`);

  // Compute planted_date so that stageEndDate is today - (safeDelay + 1) => missedDays = safeDelay + 1
  const stageEndDate = new Date(today);
  stageEndDate.setDate(stageEndDate.getDate() - (safeDelay + 1));

  const plantedDate = new Date(stageEndDate);
  plantedDate.setDate(plantedDate.getDate() - (templateStage.day_end - 1));

  log("Forcing planted_date to:", plantedDate.toISOString().split("T")[0]);
  notebook.planted_date = plantedDate;

  // Ensure stages_tracking exists and has current stage tracking
  if (!notebook.stages_tracking || notebook.stages_tracking.length === 0) {
    notebook.stages_tracking = template.stages.map((s) => ({
      stage_number: s.stage_number,
      stage_name: s.name,
      is_current: s.stage_number === currentStageNumber,
      status: s.stage_number === currentStageNumber ? "active" : "pending",
      daily_logs: [],
      observations: [],
      notifications_sent: [],
    }));
  } else {
    // ensure current stage tracking exists
    let st = notebook.stages_tracking.find(
      (s) => s.stage_number === currentStageNumber
    );
    if (!st) {
      notebook.stages_tracking.push({
        stage_number: templateStage.stage_number,
        stage_name: templateStage.name,
        is_current: true,
        status: "active",
        daily_logs: [],
        observations: [],
        notifications_sent: [],
      });
    } else {
      st.is_current = true;
      st.status = "active";
      // clear observations to simulate missing
      st.observations = [];
      st.notifications_sent = [];
    }
  }

  await notebook.save();
  log("Notebook saved with forced planted_date and cleared observations");

  // Run the controller logic that checks stage status
  await checkNotebookStageStatus(notebook);

  // Reload notebook and log status
  const updated = await Notebook.findById(notebookId);
  const current = updated.stages_tracking.find(
    (s) => s.stage_number === updated.current_stage
  );
  log("After monitoring - notebook.current_stage =", updated.current_stage);
  log("Current stage tracking status =", current?.status);
  log("Current stage missed_days =", current?.missed_days);

  // Fetch and print notifications for the user related to this notebook
  const userId = updated.user_id;
  const notifications = await Notification.find({
    user_id: userId,
    notebook_id: notebookId,
  }).sort({ createdAt: -1 });

  log(`Notifications for user ${userId} and notebook ${notebookId}:`);
  notifications.forEach((notif, idx) => {
    log(`#${idx + 1} [${notif.type}] ${notif.title}`);
    log(`   ${notif.message}`);
    log(`   createdAt: ${notif.createdAt}`);
    log(`   is_read: ${notif.is_read}`);
    log(`   metadata:`, notif.metadata);
  });

  await mongoose.connection.close();
  process.exit(0);
};

main().catch((err) => {
  console.error("Error in test_stage_auto_skip:", err);
  process.exit(1);
});
