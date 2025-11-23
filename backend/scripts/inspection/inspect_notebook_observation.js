import mongoose from "mongoose";
import dotenv from "dotenv";
import Notebook from "../models/Notebook.js";
import PlantTemplate from "../models/PlantTemplate.js";
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
  const notebookId = process.argv[2];
  if (!notebookId) {
    console.error("Usage: node inspect_notebook_observation.js <notebookId>");
    process.exit(1);
  }

  if (!MONGODB_URI) {
    console.error("Please set MONGODB_URI or equivalent in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log(new Date().toISOString(), "Connected to MongoDB");

  const nb = await Notebook.findById(notebookId).populate("template_id");
  if (!nb) {
    console.error("Notebook not found:", notebookId);
    await mongoose.connection.close();
    process.exit(1);
  }

  const today = getVietnamToday();
  // Force planted_date so current_day = day_end of stage 1
  const stage1 = nb.template_id?.stages?.find((s) => s.stage_number === 1);
  if (stage1) {
    // planted_date = today - (day_end - 0)
    const newPlanted = new Date(today);
    newPlanted.setDate(newPlanted.getDate() - (stage1.day_end - 0));
    nb.planted_date = newPlanted;
    await nb.save();
    console.log(
      `Planted_date updated to: ${fmt(newPlanted)} so current_day = ${
        stage1.day_end
      }`
    );
  }
  // Reload notebook
  const nb2 = await Notebook.findById(nb._id).populate("template_id");
  const currentDay = nb2.current_day || 0;
  const currentStageNumber = nb2.current_stage;
  const templateStage = nb2.template_id?.stages?.find(
    (s) => s.stage_number === currentStageNumber
  );

  console.log("------------------------------------------------------");
  console.log(`Notebook: ${nb._id} | name: ${nb.notebook_name}`);
  console.log(
    `planted_date: ${fmt(
      nb.planted_date
    )} | current_day: ${currentDay} | current_stage: ${currentStageNumber}`
  );

  if (!templateStage) {
    console.log("No template stage found for current_stage");
    await mongoose.connection.close();
    process.exit(0);
  }

  const stageEndDate = getStageEndDate(nb.planted_date, templateStage.day_end);
  const isLastDayOfStage = currentDay === templateStage.day_end;

  console.log(
    `Stage ${templateStage.stage_number}: ${templateStage.name} (${templateStage.day_start}-${templateStage.day_end})`
  );
  console.log(
    `Stage end date (VN): ${fmt(stageEndDate)} | today (VN): ${fmt(
      today
    )} | isLastDayOfStage: ${isLastDayOfStage}`
  );

  const requiredObs = templateStage.observation_required || [];
  console.log(
    `Required observations (template): ${
      requiredObs.length ? requiredObs.map((o) => o.key).join(", ") : "none"
    }`
  );

  const stageTrack = nb.stages_tracking.find(
    (s) => s.stage_number === currentStageNumber
  ) || { observations: [] };
  const recorded = stageTrack.observations || [];
  console.log(
    `Recorded observations (stage tracking): ${
      recorded.length
        ? recorded.map((o) => `${o.key}=${o.value}`).join(", ")
        : "none"
    }`
  );

  const completedCount =
    requiredObs.length > 0
      ? recorded.filter(
          (r) => r.value === true && requiredObs.some((ro) => ro.key === r.key)
        ).length
      : 0;
  const allCompleted =
    requiredObs.length > 0 ? completedCount >= requiredObs.length : false;

  console.log(
    `Observations completed: ${completedCount}/${requiredObs.length} => allCompleted: ${allCompleted}`
  );

  console.log(
    "Stage status:",
    stageTrack.status || "unknown",
    "| is_current:",
    !!stageTrack.is_current,
    "| completed_at:",
    fmt(stageTrack.completed_at)
  );

  if (isLastDayOfStage && requiredObs.length > 0 && !allCompleted) {
    console.log(
      "=> TODAY is last day of stage and observations are REQUIRED but NOT all recorded."
    );
  } else if (isLastDayOfStage && requiredObs.length > 0 && allCompleted) {
    console.log(
      "=> TODAY is last day of stage and ALL required observations are recorded (auto-transition possible)."
    );
  } else if (!isLastDayOfStage && requiredObs.length > 0) {
    console.log(
      "=> Observation will be required on the stage's last day:",
      templateStage.day_end
    );
  } else {
    console.log("=> No observations required for this stage.");
  }

  console.log("------------------------------------------------------");

  await mongoose.connection.close();
};

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
