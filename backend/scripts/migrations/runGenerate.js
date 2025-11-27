import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { generateDailyChecklist } from "../controllers/notebookController.js";

dotenv.config({ path: path.join(process.cwd(), ".env") });
const MONGO = process.env.MONGODB_CONNECTIONSTRING || process.env.MONGODB_URI;
if (!MONGO) {
  console.error("Missing MongoDB URI");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(MONGO);
  const id = process.argv[2];
  if (!id) {
    console.error("Notebook id required");
    process.exit(1);
  }
  try {
    const checklist = await generateDailyChecklist(id);
    console.log("Generated checklist count:", (checklist || []).length);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
