import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import Notebook from "../models/Notebook.js";
import PlantTemplate from "../models/PlantTemplate.js";

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
    const notebook = await Notebook.findById(id).populate("template_id");
    if (!notebook) {
      console.error("Notebook not found", id);
      process.exit(1);
    }
    console.log("Notebook:", notebook._id.toString(), notebook.notebook_name);
    // Recalculate progress
    const prog = await notebook.updateProgress(
      notebook.template_id?.stages || []
    );
    const stageCompletion = await notebook.getCurrentStageCompletion();
    await notebook.save();
    console.log("Recalculated progress:", prog);
    console.log("Current stage:", notebook.current_stage);
    console.log("Stage completion:", stageCompletion);
    const st = notebook.stages_tracking.find(
      (s) => s.stage_number === notebook.current_stage
    );
    console.log("Stage tracking daily_logs:", (st && st.daily_logs) || []);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
