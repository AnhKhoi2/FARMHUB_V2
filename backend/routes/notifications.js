import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import * as notificationController from "../controllers/notificationController.js";
import { triggerManualMonitoring } from "../jobs/stageMonitoringJob.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(verifyToken);

/**
 * @route GET /api/notifications
 * @desc Lấy danh sách thông báo của user
 * @query limit, skip, is_read (optional)
 */
router.get("/", notificationController.getNotifications);

/**
 * @route GET /api/notifications/unread-count
 * @desc Lấy số lượng thông báo chưa đọc
 */
router.get("/unread-count", notificationController.getUnreadCount);

/**
 * @route PATCH /api/notifications/mark-read
 * @desc Đánh dấu các thông báo đã đọc
 * @body { notification_ids: [id1, id2, ...] }
 */
router.patch("/mark-read", notificationController.markAsRead);

/**
 * @route PATCH /api/notifications/mark-all-read
 * @desc Đánh dấu tất cả thông báo của user đã đọc
 */
router.patch(
  "/mark-all-read",
  notificationController.markAllNotificationsAsRead
);

/**
 * @route DELETE /api/notifications/:id
 * @desc Xóa một thông báo
 */
router.delete("/:id", notificationController.removeNotification);

/**
 * @route POST /api/notifications/cleanup
 * @desc Cleanup old notifications (admin)
 */
router.post("/cleanup", notificationController.cleanupOld);

/**
 * @route POST /api/notifications/trigger-monitoring
 * @desc Trigger manual monitoring (cho debug/test)
 * @access Admin only (optional - có thể thêm check role)
 */
router.post(
  "/trigger-monitoring",
  asyncHandler(async (req, res) => {
    // Optional: Check if user is admin
    // if (req.user.role !== "admin") {
    //   return res.status(403).json({ success: false, message: "Forbidden" });
    // }

    await triggerManualMonitoring();

    return ok(res, null, null, "Manual monitoring triggered successfully");
  })
);

export default router;
