/**
 * Migration script để thêm các field mới vào notebooks hiện có:
 * - stage_tracking.status
 * - stage_tracking.missed_days
 * - stage_tracking.notifications_sent
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Notebook from "../models/Notebook.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const migrateNotebooks = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Lấy tất cả notebooks
    const notebooks = await Notebook.find({});
    console.log(`📊 Found ${notebooks.length} notebooks to migrate`);

    let updatedCount = 0;

    for (const notebook of notebooks) {
      let needsUpdate = false;

      // Cập nhật từng stage_tracking
      for (const stageTracking of notebook.stages_tracking) {
        // Thêm status nếu chưa có
        if (!stageTracking.status) {
          if (stageTracking.completed_at) {
            stageTracking.status = "completed";
          } else if (stageTracking.is_current) {
            stageTracking.status = "active";
          } else {
            stageTracking.status = "active";
          }
          needsUpdate = true;
        }

        // Note: missed_days/notifications_sent migration removed — no longer used

        // Thêm daily_logs nếu chưa có
        if (!stageTracking.daily_logs) {
          stageTracking.daily_logs = [];
          needsUpdate = true;
        }

        // Thêm completed_tasks nếu chưa có
        if (!stageTracking.completed_tasks) {
          stageTracking.completed_tasks = [];
          needsUpdate = true;
        }

        // Thêm observations nếu chưa có
        if (!stageTracking.observations) {
          stageTracking.observations = [];
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await notebook.save();
        updatedCount++;
        console.log(
          `✅ Updated notebook: ${notebook.notebook_name} (${notebook._id})`
        );
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Total notebooks: ${notebooks.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped: ${notebooks.length - updatedCount}`);

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Chạy migration
migrateNotebooks();
