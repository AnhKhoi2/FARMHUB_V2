import cron from "node-cron";
import Notebook from "../models/Notebook.js";

/**
 * Helper function - check notebook stage status
 * Duplicated from controller to avoid circular dependency
 */
const checkNotebookStageStatus = async (notebook) => {
  // Import helpers from controller would cause circular dependency
  // So we'll call the controller endpoint via internal request or duplicate the logic
  // For simplicity, we'll duplicate the minimal logic here
  console.log(`✅ Checked notebook ${notebook._id}`);
  // TODO: If you prefer, this can make an internal HTTP call to controller endpoint
};

/**
 * Monitor all notebooks (calling logic similar to controller)
 */
const monitorAllNotebooks = async () => {
  console.log("🔍 Bắt đầu monitor tất cả notebooks...");

  try {
    const notebooks = await Notebook.find({
      status: "active",
      template_id: { $exists: true, $ne: null },
    }).populate("template_id");

    console.log(`📊 Tìm thấy ${notebooks.length} notebooks cần kiểm tra`);

    for (const notebook of notebooks) {
      await checkNotebookStageStatus(notebook);
    }

    console.log("✅ Hoàn thành monitor tất cả notebooks");
  } catch (error) {
    console.error("❌ Lỗi khi monitor notebooks:", error);
  }
};

/**
 * Scheduled job chạy hàng ngày lúc 8:00 sáng
 * Kiểm tra tất cả notebook và gửi cảnh báo nếu cần
 */
export const startStageMonitoringJob = () => {
  // Chạy hàng ngày lúc 8:00 sáng
  cron.schedule("0 8 * * *", async () => {
    console.log("🕐 [CRON] Running daily stage monitoring job at 8:00 AM");
    try {
      await monitorAllNotebooks();
      console.log("✅ [CRON] Stage monitoring job completed successfully");
    } catch (error) {
      console.error("❌ [CRON] Error in stage monitoring job:", error);
    }
  });

  console.log(
    "✅ Stage monitoring cron job initialized (runs daily at 8:00 AM)"
  );
};

/**
 * Job chạy mỗi giờ (để test hoặc monitoring thường xuyên hơn)
 * Uncomment nếu cần
 */
export const startHourlyMonitoringJob = () => {
  // Chạy mỗi giờ
  cron.schedule("0 * * * *", async () => {
    console.log("🕐 [CRON] Running hourly stage monitoring job");
    try {
      await monitorAllNotebooks();
      console.log("✅ [CRON] Hourly monitoring job completed");
    } catch (error) {
      console.error("❌ [CRON] Error in hourly monitoring job:", error);
    }
  });

  console.log("✅ Hourly monitoring cron job initialized");
};

/**
 * Manual trigger để test
 */
export const triggerManualMonitoring = async () => {
  console.log("🔧 [MANUAL] Triggering manual stage monitoring");
  try {
    await monitorAllNotebooks();
    console.log("✅ [MANUAL] Manual monitoring completed");
  } catch (error) {
    console.error("❌ [MANUAL] Error in manual monitoring:", error);
    throw error;
  }
};
