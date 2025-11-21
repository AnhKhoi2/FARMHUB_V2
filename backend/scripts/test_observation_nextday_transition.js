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

const main = async () => {
  console.log("== test_observation_nextday_transition START ==");
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
    console.log(
      `Not on last day of stage. current_day=${currentDay}, day_end=${templateStage.day_end}`
    );
    // Adjust planted_date so that current_day becomes day_end for testing
    const today = new Date();
    const desiredPlanted = new Date(
      today.getTime() - (templateStage.day_end - 1) * 24 * 60 * 60 * 1000
    );
    nb.planted_date = desiredPlanted;
    await nb.save();
    console.log(
      `Adjusted planted_date to ${
        nb.planted_date.toISOString().split("T")[0]
      } for testing`
    );
    // reload values
    await nb.populate("template_id");
  }
  // Ghi nhận observation (sử dụng controller helper để trigger logic hoàn thành stage)
  const obsKey = templateStage.observation_required[0]?.key;
  if (!obsKey) {
    console.error("No observation key found for this stage");
    process.exit(1);
  }
  const ctrl = await import("../controllers/notebookController.js");
  await ctrl.updateStageObservation(NOTEBOOK_ID, obsKey, true);
  console.log(
    `Observation '${obsKey}' recorded via controller for notebook ${NOTEBOOK_ID}`
  );

  // Reload notebook after controller saved changes
  nb = await Notebook.findById(NOTEBOOK_ID).populate("template_id");

  // Giả lập qua ngày hôm sau
  nb.planted_date = new Date(nb.planted_date.getTime() - 24 * 60 * 60 * 1000); // tăng current_day lên 1
  await nb.save();

  // Gọi hàm kiểm tra stage như cron job (sử dụng fresh notebook instance)
  const { checkNotebookStageStatus } = await import(
    "../controllers/notebookController.js"
  );
  const fresh = await Notebook.findById(NOTEBOOK_ID).populate("template_id");
  try {
    await checkNotebookStageStatus(fresh);
  } catch (err) {
    console.warn("checkNotebookStageStatus threw:", err.message);
  }

  // Now trigger daily checklist generation as it would run on the new day
  try {
    const gen = await import("../controllers/notebookController.js");
    const checklist = await gen.generateDailyChecklist(NOTEBOOK_ID);
    console.log(
      "Generated checklist for new stage, items:",
      checklist ? checklist.length : 0
    );
  } catch (err) {
    console.warn("generateDailyChecklist threw:", err.message);
  }

  // Reload và kiểm tra chuyển stage, checklist
  nb = await Notebook.findById(NOTEBOOK_ID).populate("template_id");
  const newStage = nb.current_stage;
  const newStageTrack = nb.stages_tracking.find(
    (s) => s.stage_number === newStage
  );
  console.log(`Current stage after next day: ${newStage}`);
  if (newStageTrack) {
    console.log(`Stage status: ${newStageTrack.status}`);
    console.log(
      `Checklist count: ${
        Array.isArray(newStageTrack.checklist)
          ? newStageTrack.checklist.length
          : "N/A"
      }`
    );
  } else {
    console.log("Không tìm thấy dữ liệu cho stage mới.");
  }
  if (newStage > currentStage) {
    console.log("✅ Stage auto-transitioned on next day after observation!");
  } else {
    console.log("❌ Stage did not auto-transition. Check logic.");
  }
  await mongoose.connection.close();
};

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
