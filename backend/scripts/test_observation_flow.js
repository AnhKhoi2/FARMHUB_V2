import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "../models/User.js";
import PlantTemplate from "../models/PlantTemplate.js";
import Notebook from "../models/Notebook.js";
import { getVietnamToday } from "../utils/timezone.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGODB_CONNECTIONSTRING ||
  process.env.MONGO_URL ||
  process.env.MONGO;

const log = (...args) => console.log(new Date().toISOString(), ...args);

const main = async () => {
  if (!MONGODB_URI) {
    console.error(
      "Please set one of MONGODB_URI, MONGO_URI or MONGODB_CONNECTIONSTRING in .env"
    );
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  log("Connected to MongoDB");

  // 1) Find/create user
  let user = await User.findOne({ username: "test_obs_user" });
  if (!user) {
    user = await User.create({
      username: "test_obs_user",
      email: "test_obs_user+bot@example.com",
      provider: "local",
      password: "password123",
    });
    log("Created test user", user._id.toString());
  } else {
    log("Found test user", user._id.toString());
  }

  // 2) Create template where stage 1 is single-day and requires observation
  let template = await PlantTemplate.findOne({
    template_name: "Obs Test Template",
  });
  if (!template) {
    template = await PlantTemplate.create({
      template_name: "Obs Test Template",
      plant_group: "herb",
      created_by: user._id,
      stages: [
        {
          stage_number: 1,
          name: "Stage with observation",
          day_start: 20,
          day_end: 20,
          weight: 33,
          observation_required: [
            { key: "has_true_leaf", label: "Đã có lá thật?" },
          ],
        },
        {
          stage_number: 2,
          name: "Stage 2",
          day_start: 21,
          day_end: 30,
          weight: 33,
        },
        {
          stage_number: 3,
          name: "Stage 3",
          day_start: 31,
          day_end: 40,
          weight: 34,
        },
      ],
      status: "active",
    });
    log("Created template", template._id.toString());
  } else {
    log("Found template", template._id.toString());
  }

  // 3) Compute planted_date so that today is day 20
  const today = getVietnamToday();
  const plantedDate = new Date(today);
  plantedDate.setDate(plantedDate.getDate() - (20 - 1)); // day 20 -> subtract 19

  log("Today (VN):", today.toISOString().split("T")[0]);
  log("Planted date set to:", plantedDate.toISOString().split("T")[0]);

  // 4) Create notebook with stage 1 current and no observations
  let notebook = await Notebook.create({
    user_id: user._id,
    notebook_name: "Obs Test Notebook",
    plant_type: "Hung Be",
    template_id: template._id,
    planted_date: plantedDate,
    stages_tracking: [
      {
        stage_number: 1,
        stage_name: "Stage with observation",
        started_at: plantedDate,
        is_current: true,
        status: "active",
        daily_logs: [],
        observations: [],
        completed_tasks: [],
      },
    ],
  });
  log("Created notebook", notebook._id.toString());

  // 5) Verify template says observation is required for today's stage
  const currentDay = notebook.current_day;
  const templateStage = template.getStageByDay(currentDay);
  if (!templateStage) {
    log("No template stage found for current day", currentDay);
  } else {
    log(
      "Template stage for current day:",
      templateStage.stage_number,
      templateStage.name
    );
    log(
      "Observation required fields:",
      templateStage.observation_required || []
    );
  }

  // 6) Check notebook stage tracking - observation should be missing
  notebook = await Notebook.findById(notebook._id);
  const stageTrack = notebook.stages_tracking.find((s) => s.stage_number === 1);
  if (!stageTrack) {
    throw new Error("Stage tracking missing");
  }

  log("StageTrack observations before:", stageTrack.observations || []);

  // If observation_required exists but no observation recorded, we should NOT auto-transition
  const needsObservation =
    templateStage &&
    templateStage.observation_required &&
    templateStage.observation_required.length > 0;
  if (
    needsObservation &&
    (!stageTrack.observations || stageTrack.observations.length === 0)
  ) {
    log(
      "Observation is required but not recorded — stage should NOT be auto-completed."
    );
  }

  // 7) Now simulate user adding the observation (e.g., observed true)
  log("Recording observation and completing stage...");
  stageTrack.observations.push({
    key: "has_true_leaf",
    value: true,
    observed_at: new Date(),
  });
  stageTrack.completed_at = new Date();
  stageTrack.status = "completed";
  stageTrack.is_current = false;
  notebook.current_stage = 2;

  // Add a daily log for today as well
  stageTrack.daily_logs.push({ date: today, daily_progress: 100 });

  await notebook.save();
  log("Saved notebook after observation and stage completion");

  // 8) Recompute progress
  const refreshed = await Notebook.findById(notebook._id).populate(
    "template_id"
  );
  const prog = await refreshed.updateProgress(refreshed.template_id.stages);
  log("Progress after observation & stage completion:", prog + "%");

  await mongoose.connection.close();
  process.exit(0);
};

main().catch((err) => {
  console.error("Test observation script error:", err);
  process.exit(1);
});
