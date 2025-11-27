import cron from "node-cron";
import Notebook from "../models/Notebook.js";
import { sendDailyReminderNotification } from "../controllers/notificationController.js";
import { getVietnamToday, toVietnamMidnight } from "../utils/timezone.js";

/**
 * Kiểm tra notebook có tasks chưa hoàn thành từ ngày hôm trước
 */
const checkIncompleteTasksForNotebook = async (notebook) => {
  try {
    // Chỉ check nếu có daily_checklist
    if (!notebook.daily_checklist || notebook.daily_checklist.length === 0) {
      return;
    }

    const today = getVietnamToday();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Đếm số tasks chưa hoàn thành từ ngày hôm qua
    const incompleteTasks = notebook.daily_checklist.filter((task) => {
      if (!task.created_at) return false;
      const taskDate = toVietnamMidnight(task.created_at);

      // Task được tạo hôm qua và chưa completed
      return taskDate.getTime() === yesterday.getTime() && !task.is_completed;
    });

    if (incompleteTasks.length > 0) {
      console.log(
        `📋 Notebook ${notebook._id}: ${incompleteTasks.length} incomplete tasks from yesterday`
      );

      // Gửi notification nhắc nhở
      await sendDailyReminderNotification(
        notebook.user,
        notebook._id,
        incompleteTasks.length
      );

      console.log(`✅ Sent reminder notification for notebook ${notebook._id}`);
    }
  } catch (error) {
    console.error(
      `❌ Error checking incomplete tasks for notebook ${notebook._id}:`,
      error
    );
  }
};

/**
 * Kiểm tra tất cả notebooks và gửi reminders cho incomplete tasks
 */
const checkAllNotebooksForReminders = async () => {
  console.log("🔔 Bắt đầu kiểm tra incomplete tasks cho tất cả notebooks...");

  try {
    const notebooks = await Notebook.find({
      status: "active",
      template_id: { $exists: true, $ne: null },
    }).populate("template_id");

    console.log(`📊 Tìm thấy ${notebooks.length} active notebooks`);

    let reminderCount = 0;
    for (const notebook of notebooks) {
      await checkIncompleteTasksForNotebook(notebook);
      reminderCount++;
    }

    console.log(
      `✅ Hoàn thành kiểm tra ${reminderCount} notebooks cho task reminders`
    );
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra task reminders:", error);
  }
};

/**
 * Scheduled job chạy hàng ngày lúc 9:00 sáng
 * Kiểm tra tasks chưa hoàn thành từ ngày hôm trước và gửi reminders
 */
export const startTaskReminderJob = () => {
  // Run daily at 02:00 UTC (equivalent to 09:00 Asia/Ho_Chi_Minh)
  cron.schedule(
    "0 2 * * *",
    async () => {
      console.log(
        "🕐 [CRON] Running daily task reminder job at 02:00 UTC (09:00 VN)"
      );
      try {
        await checkAllNotebooksForReminders();
        console.log("✅ [CRON] Task reminder job completed successfully");
      } catch (error) {
        console.error("❌ [CRON] Error in task reminder job:", error);
      }
    },
    { timezone: "UTC" }
  );

  console.log("✅ Task reminder cron job initialized (runs daily at 9:00 AM)");
};

/**
 * Manual trigger để test
 */
export const triggerManualReminder = async () => {
  console.log("🔧 [MANUAL] Triggering manual task reminder check");
  try {
    await checkAllNotebooksForReminders();
    console.log("✅ [MANUAL] Manual task reminder completed");
  } catch (error) {
    console.error("❌ [MANUAL] Error in manual reminder:", error);
    throw error;
  }
};
