import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import Notebook from "../models/Notebook.js";
import { toVietnamMidnight, getVietnamToday } from "../utils/timezone.js";

dotenv.config({ path: path.join(process.cwd(), ".env") });
const MONGO = process.env.MONGODB_CONNECTIONSTRING || process.env.MONGODB_URI;
if (!MONGO) {
  console.error("Missing MongoDB URI");
  process.exit(1);
}

/**
 * Script: list notebooks where planted_date (VN-day) is before createdAt VN-day
 * Usage: node ./scripts/checkPlantedDates.js [daysBack]
 */
const daysBack = parseInt(process.argv[2] || "7", 10);

const run = async () => {
  await mongoose.connect(MONGO);
  try {
    const today = getVietnamToday();
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - daysBack);

    // Find notebooks created in the window
    const docs = await Notebook.find({ createdAt: { $gte: fromDate } })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    console.log(
      `Checked ${docs.length} notebooks created since ${
        toVietnamMidnight(fromDate).toISOString().split("T")[0]
      }`
    );

    const mismatches = [];
    for (const d of docs) {
      const createdVN = toVietnamMidnight(new Date(d.createdAt));
      const plantedVN = d.planted_date
        ? toVietnamMidnight(new Date(d.planted_date))
        : null;
      if (!plantedVN) continue;
      const dayDiff = (createdVN - plantedVN) / (1000 * 60 * 60 * 24);
      if (dayDiff < 0) {
        // planted in future relative to created (weird)
        mismatches.push({
          id: d._id,
          createdAt: d.createdAt,
          planted_date: d.planted_date,
          note: "planted after created",
        });
      } else if (dayDiff > 0) {
        // planted_date earlier than created VN day
        mismatches.push({
          id: d._id,
          createdAt: d.createdAt,
          planted_date: d.planted_date,
          daysEarlier: dayDiff,
        });
      }
    }

    console.log(`Found ${mismatches.length} mismatched notebooks:`);
    mismatches.slice(0, 200).forEach((m) => console.log(m));
  } catch (e) {
    console.error("Error", e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
