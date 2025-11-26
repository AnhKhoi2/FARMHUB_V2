import mongoose from "mongoose";
import dotenv from "dotenv";
import Notebook from "../models/Notebook.js";
import PlantTemplate from "../models/PlantTemplate.js";
import { sendObservationRequiredNotification } from "../../controllers/notificationController.js";
import { getVietnamToday, toVietnamMidnight } from "../utils/timezone.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGODB_CONNECTIONSTRING ||
  process.env.MONGO_URL ||
  process.env.MONGO;

const fmt = (d) => (d ? d.toISOString().split("T")[0] : null);

const getStageEndDate = (plantedDate, stageEndDay) => {
  const endDate = new Date(plantedDate);
  endDate.setDate(endDate.getDate() + stageEndDay - 1);
  return toVietnamMidnight(endDate);
};

const main = async () => {
  if (!MONGODB_URI) {
    console.error(
      "Please set one of MONGODB_URI, MONGO_URI or MONGODB_CONNECTIONSTRING in .env"
    );
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log(new Date().toISOString(), "Connected to MongoDB");

  const today = getVietnamToday();

  const notebooks = await Notebook.find({
    status: "active",
    template_id: { $exists: true, $ne: null },
  }).populate("template_id");

  if (!notebooks || notebooks.length === 0) {
    console.log("No active notebooks with template found");
    await mongoose.connection.close();
    return;
  }

  for (const nb of notebooks) {
    const tpl = nb.template_id;
    const currentDay = nb.current_day || 0;
    const currentStageNumber = nb.current_stage;
    const templateStage = tpl.stages.find(
      (s) => s.stage_number === currentStageNumber
    );

    console.log(
      "--------------------------------------------------------------"
    );
    console.log(
      `notebook: ${nb._id} | name: ${nb.notebook_name} | user: ${nb.user_id}`
    );
    console.log(
      `planted_date: ${fmt(
        nb.planted_date
      )} | current_day: ${currentDay} | current_stage: ${currentStageNumber}`
    );

    if (!templateStage) {
      console.log("  No template stage found for current_stage");
      continue;
    }

    const stageEndDate = getStageEndDate(
      nb.planted_date,
      templateStage.day_end
    );
    const isLastDayOfStage = currentDay === templateStage.day_end;

    console.log(
      `  Stage ${templateStage.stage_number}: ${templateStage.name} (${templateStage.day_start}-${templateStage.day_end})`
    );
    console.log(
      `  Stage end date (VN): ${fmt(
        stageEndDate
      )} | isLastDayOfStage: ${isLastDayOfStage}`
    );

    const requiredObs = templateStage.observation_required || [];
    console.log(
      `  required observations: ${
        requiredObs.length ? requiredObs.map((o) => o.key).join(", ") : "none"
      }`
    );

    const stageTrack = nb.stages_tracking.find(
      (s) => s.stage_number === currentStageNumber
    ) || { observations: [] };
    const recorded = stageTrack.observations || [];
    console.log(
      `  recorded observations: ${
        recorded.length
          ? recorded.map((o) => `${o.key}=${o.value}`).join(", ")
          : "none"
      }`
    );

    const completedCount =
      requiredObs.length > 0
        ? recorded.filter(
            (r) =>
              r.value === true && requiredObs.some((ro) => ro.key === r.key)
          ).length
        : 0;
    const allCompleted =
      requiredObs.length > 0 ? completedCount >= requiredObs.length : false;

    console.log(
      `  required completed: ${completedCount}/${requiredObs.length} => allCompleted: ${allCompleted}`
    );
    console.log(
      `  stage status: ${
        stageTrack.status || "unknown"
      } | is_current: ${!!stageTrack.is_current} | completed_at: ${fmt(
        stageTrack.completed_at
      )}`
    );

    if (isLastDayOfStage && requiredObs.length > 0 && !allCompleted) {
      console.log(
        "  => TODAY is last day of stage and observations are required but NOT all recorded."
      );

      try {
        const requiredKeys = requiredObs.map((o) => o.key);
        const recordedKeys = recorded.map((r) => r.key);

        await sendObservationRequiredNotification({
          userId: nb.user_id,
          notebookId: nb._id,
          notebookName: nb.notebook_name || nb.notebookName || "(notebook)",
          stageNumber: templateStage.stage_number,
          stageName: templateStage.name,
          requiredKeys,
          recordedKeys,
        });
      } catch (err) {
        console.error("Error sending observation_required notification:", err);
      }
    } else if (isLastDayOfStage && requiredObs.length > 0 && allCompleted) {
      console.log(
        "  => TODAY is last day of stage and all observations ARE completed (auto-transition possible)."
      );
    }
  }

  console.log("--------------------------------------------------------------");
  await mongoose.connection.close();
};

main().catch((err) => {
  console.error("Error running report:", err);
  process.exit(1);
});
