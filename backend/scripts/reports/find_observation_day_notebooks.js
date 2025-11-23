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

const main = async () => {
  await mongoose.connect(MONGODB_URI);
  const notebooks = await Notebook.find({
    status: "active",
    template_id: { $exists: true, $ne: null },
  }).populate("template_id");

  let found = [];
  for (const nb of notebooks) {
    const tpl = nb.template_id;
    const currentDay = nb.current_day || 0;
    const currentStageNumber = nb.current_stage;
    const templateStage = tpl.stages.find(
      (s) => s.stage_number === currentStageNumber
    );
    if (!templateStage) continue;
    const requiredObs = templateStage.observation_required || [];
    if (!requiredObs.length) continue;
    const isLastDayOfStage = currentDay === templateStage.day_end;
    if (!isLastDayOfStage) continue;
    const stageTrack = nb.stages_tracking.find(
      (s) => s.stage_number === currentStageNumber
    ) || { observations: [] };
    const recorded = stageTrack.observations || [];
    const completedCount =
      requiredObs.length > 0
        ? recorded.filter(
            (r) =>
              r.value === true && requiredObs.some((ro) => ro.key === r.key)
          ).length
        : 0;
    const allCompleted = completedCount >= requiredObs.length;
    if (!allCompleted) {
      found.push({
        id: nb._id,
        name: nb.notebook_name,
        user: nb.user_id,
        planted_date: fmt(nb.planted_date),
        current_day: currentDay,
        current_stage: currentStageNumber,
        stage_name: templateStage.name,
        day_start: templateStage.day_start,
        day_end: templateStage.day_end,
        required_observations: requiredObs.map((o) => o.key),
        recorded_observations: recorded.map((o) => `${o.key}=${o.value}`),
      });
    }
  }
  if (found.length === 0) {
    console.log(
      "Không có notebook nào đang ở ngày cuối giai đoạn và cần observation chưa hoàn thành."
    );
  } else {
    console.log("Các notebook thỏa điều kiện observation ngày cuối giai đoạn:");
    found.forEach((nb) => {
      console.log(`- id: ${nb.id} | name: ${nb.name} | user: ${nb.user}`);
      console.log(
        `  planted_date: ${nb.planted_date} | current_day: ${nb.current_day} | current_stage: ${nb.current_stage} (${nb.stage_name})`
      );
      console.log(`  Stage days: ${nb.day_start}-${nb.day_end}`);
      console.log(
        `  Required observations: ${nb.required_observations.join(", ")}`
      );
      console.log(
        `  Recorded observations: ${
          nb.recorded_observations.length
            ? nb.recorded_observations.join(", ")
            : "none"
        }`
      );
    });
  }
  await mongoose.connection.close();
};

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
