import mongoose from "mongoose";
import dotenv from "dotenv";
import Notebook from "../models/Notebook.js";
import PlantTemplate from "../models/PlantTemplate.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGODB_CONNECTIONSTRING ||
  process.env.MONGO_URL ||
  process.env.MONGO;

const NOTEBOOK_ID = "692033b22d7102b7a7b63232";

const fmt = (d) => (d ? d.toISOString().split("T")[0] : null);

const main = async () => {
  await mongoose.connect(MONGODB_URI);
  let nb = await Notebook.findById(NOTEBOOK_ID).populate("template_id");
  if (!nb) {
    console.error("Notebook not found");
    process.exit(1);
  }
  const currentDay = nb.current_day;
  const currentStage = nb.current_stage;
  const templateStage = nb.template_id.stages.find(
    (s) => s.stage_number === currentStage
  );
  if (!templateStage) {
    console.error("No template stage found");
    process.exit(1);
  }
  if (currentDay !== templateStage.day_end) {
    console.error(
      `Not on last day of stage. current_day=${currentDay}, day_end=${templateStage.day_end}`
    );
    process.exit(1);
  }
  // Ghi nhận observation
  const obsKey = templateStage.observation_required[0]?.key;
  if (!obsKey) {
    console.error("No observation required for this stage");
    process.exit(1);
  }
  const stageTrack = nb.stages_tracking.find(
    (s) => s.stage_number === currentStage
  );
  stageTrack.observations.push({
    key: obsKey,
    value: true,
    observed_at: new Date(),
  });
  await nb.save();
  console.log(`Observation '${obsKey}' recorded for notebook ${NOTEBOOK_ID}`);
  // Reload và kiểm tra chuyển stage
  nb = await Notebook.findById(NOTEBOOK_ID).populate("template_id");
  const newStage = nb.current_stage;
  const newStageTrack = nb.stages_tracking.find(
    (s) => s.stage_number === newStage
  );
  console.log(`Current stage after observation: ${newStage}`);
  console.log(`Stage status: ${newStageTrack.status}`);
  if (newStage > currentStage) {
    console.log("✅ Stage auto-transitioned after observation!");
  } else {
    console.log("❌ Stage did not auto-transition. Check logic.");
  }
  await mongoose.connection.close();
};

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
