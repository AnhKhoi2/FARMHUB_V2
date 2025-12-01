import cron from "node-cron";
import Notebook from "../models/Notebook.js";
import Notification from "../models/Notification.js";
import { sendDailyTasksGeneratedNotification } from "../controllers/notificationController.js";
import { generateDailyChecklist } from "../controllers/notebookController.js";
import { getVietnamToday, toVietnamMidnight } from "../utils/timezone.js";

/**
 * Job chạy hàng ngày lúc 07:00 (Asia/Ho_Chi_Minh)
 * - Tìm các notebook có `last_checklist_generated` là hôm nay
 * - Nếu chưa gửi notification `daily_tasks_generated` cho notebook đó trong ngày hôm nay thì gửi
 */
export const startDailyTasksNotificationJob = () => {
  // Run daily at 07:00 UTC
  cron.schedule(
    "0 7 * * *",
    async () => {
      console.log(
        "🕐 [CRON] Running daily tasks notification job at 07:00 UTC"
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
            // Ensure today's checklist exists. If not, generate it now so
            // overdue tasks and reminders are created even if user never
            // opened the notebook UI.
            const lastGen = nb.last_checklist_generated
              ? toVietnamMidnight(new Date(nb.last_checklist_generated))
              : null;

            if (!lastGen || lastGen.getTime() < todayStart.getTime()) {
              try {
                await generateDailyChecklist(nb._id);
                // reload notebook to pick up updated last_checklist_generated
                // (so subsequent notification logic sees the fresh state)
                // eslint-disable-next-line no-await-in-loop
                const fresh = await Notebook.findById(nb._id).populate(
                  "template_id"
                );
                if (fresh) {
                  // copy over last_checklist_generated for notification check
                  nb.last_checklist_generated = fresh.last_checklist_generated;
                }
              } catch (e) {
                console.error(
                  `❌ Failed to generate checklist for notebook ${nb._id}:`,
                  e
                );
                // continue to next notebook
                continue;
              }
            }

            const newLastGen = nb.last_checklist_generated
              ? toVietnamMidnight(new Date(nb.last_checklist_generated))
              : null;
            if (!newLastGen || newLastGen.getTime() !== todayStart.getTime())
              continue;

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
    "✅ Daily tasks notification cron job initialized (runs daily at 07:00 UTC)"
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
