import cron from "node-cron";
import Notebook from "../models/Notebook.js";
import Notification from "../models/Notification.js";
import { sendDailyTasksGeneratedNotification } from "../controllers/notificationController.js";
import { getVietnamToday, toVietnamMidnight } from "../utils/timezone.js";

/**
 * Job chạy hàng ngày lúc 07:00 (Asia/Ho_Chi_Minh)
 * - Tìm các notebook có `last_checklist_generated` là hôm nay
 * - Nếu chưa gửi notification `daily_tasks_generated` cho notebook đó trong ngày hôm nay thì gửi
 */
export const startDailyTasksNotificationJob = () => {
  // Run daily at 00:00 UTC (equivalent to 07:00 Asia/Ho_Chi_Minh)
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log(
        "🕐 [CRON] Running daily tasks notification job at 00:00 UTC (07:00 VN)"
      );
      try {
        const today = getVietnamToday();
        const todayStart = toVietnamMidnight(today);
        const tomorrow = new Date(todayStart);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Tìm các notebook active có template
        const notebooks = await Notebook.find({
          status: "active",
          template_id: { $exists: true, $ne: null },
        }).populate("template_id");

        console.log(
          `📊 Checking ${notebooks.length} notebooks for daily tasks generated`
        );

        for (const nb of notebooks) {
          try {
            if (!nb.last_checklist_generated) continue;

            const lastGen = toVietnamMidnight(
              new Date(nb.last_checklist_generated)
            );
            if (lastGen.getTime() !== todayStart.getTime()) continue;

            // Kiểm tra đã gửi notification 'daily_tasks_generated' hôm nay chưa
            const existing = await Notification.findOne({
              notebook_id: nb._id,
              type: "daily_tasks_generated",
              createdAt: { $gte: todayStart, $lt: tomorrow },
            });

            if (existing) {
              // Đã gửi
              continue;
            }

            const tasksCount = Array.isArray(nb.daily_checklist)
              ? nb.daily_checklist.length
              : 0;

            await sendDailyTasksGeneratedNotification({
              userId: nb.user_id,
              notebookId: nb._id,
              notebookName: nb.notebook_name,
              tasksCount,
            });
          } catch (err) {
            console.error(`❌ Error processing notebook ${nb._id}:`, err);
          }
        }

        console.log("✅ [CRON] Daily tasks notification job completed");
      } catch (err) {
        console.error("❌ [CRON] Error in daily tasks notification job:", err);
      }
    },
    { timezone: "UTC" }
  );

  console.log(
    "✅ Daily tasks notification cron job initialized (runs daily at 07:00 VN)"
  );
};

// Manual trigger function to run the notification logic once (useful for testing)
export const triggerDailyTasksNotification = async () => {
  console.log("🔧 [MANUAL] Triggering daily tasks notification job (manual)");
  try {
    const today = getVietnamToday();
    const todayStart = toVietnamMidnight(today);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const notebooks = await Notebook.find({
      status: "active",
      template_id: { $exists: true, $ne: null },
    }).populate("template_id");

    for (const nb of notebooks) {
      try {
        if (!nb.last_checklist_generated) continue;

        const lastGen = toVietnamMidnight(
          new Date(nb.last_checklist_generated)
        );
        if (lastGen.getTime() !== todayStart.getTime()) continue;

        const existing = await Notification.findOne({
          notebook_id: nb._id,
          type: "daily_tasks_generated",
          createdAt: { $gte: todayStart, $lt: tomorrow },
        });

        if (existing) continue;

        const tasksCount = Array.isArray(nb.daily_checklist)
          ? nb.daily_checklist.length
          : 0;

        await sendDailyTasksGeneratedNotification({
          userId: nb.user_id,
          notebookId: nb._id,
          notebookName: nb.notebook_name,
          tasksCount,
        });
      } catch (err) {
        console.error(`❌ Error processing notebook ${nb._id}:`, err);
      }
    }

    console.log("✅ [MANUAL] Daily tasks notification manual run completed");
    return { success: true };
  } catch (err) {
    console.error("❌ [MANUAL] Error in manual daily tasks notification:", err);
    return { success: false, error: err.message };
  }
};
