import cron from "node-cron";
import Notebook from "../models/Notebook.js";
import { sendDailyReminderNotification } from "../controllers/notificationController.js";

/**
 * Kiểm tra notebook có tasks chưa hoàn thành từ ngày hôm trước
 */
const checkIncompleteTasksForNotebook = async (notebook) => {
  try {
    // Chỉ check nếu có daily_checklist
    if (!notebook.daily_checklist || notebook.daily_checklist.length === 0) {
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Đếm số tasks chưa hoàn thành từ ngày hôm qua
    const incompleteTasks = notebook.daily_checklist.filter((task) => {
      const taskDate = new Date(task.created_at);
      taskDate.setHours(0, 0, 0, 0);

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
  // Chạy hàng ngày lúc 9:00 sáng (sau khi users bắt đầu ngày làm việc)
  cron.schedule("0 9 * * *", async () => {
    console.log("🕐 [CRON] Running daily task reminder job at 9:00 AM");
    try {
      await checkAllNotebooksForReminders();
      console.log("✅ [CRON] Task reminder job completed successfully");
    } catch (error) {
      console.error("❌ [CRON] Error in task reminder job:", error);
    }
  });

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
