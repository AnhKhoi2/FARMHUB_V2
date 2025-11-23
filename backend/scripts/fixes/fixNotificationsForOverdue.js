import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import Notebook from "../models/Notebook.js";
import Notification from "../models/Notification.js";

dotenv.config({ path: path.join(process.cwd(), ".env") });
const MONGO = process.env.MONGODB_CONNECTIONSTRING || process.env.MONGODB_URI;
if (!MONGO) {
  console.error("Missing MongoDB URI");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(MONGO);
  console.log("Connected");

  // Find notebooks with overdue_tasks present in current stage
  const notebooks = await Notebook.find({
    "stages_tracking.overdue_tasks.0": { $exists: true },
    status: { $ne: "deleted" },
  });

  console.log(`Found ${notebooks.length} notebooks with overdue_tasks`);

  for (const nb of notebooks) {
    const currentStageTracking = nb.stages_tracking.find(
      (s) => s.stage_number === nb.current_stage
    );
    const overdueCount = (currentStageTracking?.overdue_tasks || []).filter(
      (t) => t.status === "overdue"
    ).length;
    if (overdueCount === 0) continue;

    // Check if a recent daily_reminder exists for this notebook
    const exists = await Notification.findOne({
      notebook_id: nb._id,
      type: "daily_reminder",
    }).sort({ createdAt: -1 });
    if (exists) {
      console.log(`Skipping ${nb._id} (notification exists: ${exists._id})`);
      continue;
    }

    const notif = await Notification.create({
      user_id: nb.user_id,
      notebook_id: nb._id,
      type: "daily_reminder",
      title: `🌱 Nhắc nhở: ${nb.notebook_name}`,
      message: `Bạn có ${overdueCount} công việc chưa hoàn thành hôm trước. Vui lòng kiểm tra checklist.`,
      metadata: { notebook_name: nb.notebook_name },
    });

    console.log(
      `Created notification ${notif._id} for notebook ${nb._id} (${overdueCount} overdue)`
    );
  }

  await mongoose.disconnect();
  console.log("Done");
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
