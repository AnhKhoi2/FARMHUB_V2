import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Gửi thông báo cảnh báo stage trễ (warning)
 */
export const sendStageWarningNotification = async ({
  userId,
  notebookId,
  notebookName,
  stageNumber,
  stageName,
  missedDays,
  safeDelayDays,
}) => {
  const title = `⚠️ Trễ hạn: ${notebookName}`;
  let message = "";

  if (missedDays === 1) {
    message = `Bạn đã trễ ${missedDays} ngày so với giai đoạn "${stageName}". Vui lòng hoàn thành checklist để cây phát triển đúng tiến độ.`;
  } else if (missedDays < safeDelayDays) {
    message = `⚠️ Bạn đã trễ ${missedDays} ngày so với giai đoạn "${stageName}". Còn ${
      safeDelayDays - missedDays
    } ngày trước khi quá hạn.`;
  } else {
    message = `⚠️⚠️ Bạn đã trễ ${missedDays} ngày — đang gần quá hạn cho giai đoạn "${stageName}".`;
  }

  const notification = await Notification.create({
    user_id: userId,
    notebook_id: notebookId,
    type: "stage_warning",
    title,
    message,
    metadata: {
      stage_number: stageNumber,
      stage_name: stageName,
      missed_days: missedDays,
      safe_delay_days: safeDelayDays,
      notebook_name: notebookName,
    },
  });

  console.log(
    `📧 Sent stage_warning notification to user ${userId} for notebook ${notebookId}, stage ${stageNumber}, missedDay ${missedDays}`
  );

  return notification;
};

/**
 * Gửi thông báo stage bị skip tự động
 */
export const sendStageSkippedNotification = async ({
  userId,
  notebookId,
  notebookName,
  stageNumber,
  stageName,
  missedDays,
  safeDelayDays,
}) => {
  const title = `⏭️ Giai đoạn bị bỏ qua: ${notebookName}`;
  const message = `Giai đoạn "${stageName}" đã bị bỏ qua tự động do quá thời gian cho phép (${missedDays} ngày > ${safeDelayDays} ngày). Hệ thống đã chuyển sang giai đoạn tiếp theo.`;

  const notification = await Notification.create({
    user_id: userId,
    notebook_id: notebookId,
    type: "stage_skipped",
    title,
    message,
    metadata: {
      stage_number: stageNumber,
      stage_name: stageName,
      missed_days: missedDays,
      safe_delay_days: safeDelayDays,
      notebook_name: notebookName,
    },
  });

  console.log(
    `📧 Sent stage_skipped notification to user ${userId} for notebook ${notebookId}, stage ${stageNumber}`
  );

  return notification;
};

/**
 * Gửi thông báo stage quá hạn (không auto_skip)
 */
export const sendStageOverdueNotification = async ({
  userId,
  notebookId,
  notebookName,
  stageNumber,
  stageName,
  missedDays,
  safeDelayDays,
}) => {
  const title = `🚨 Quá hạn: ${notebookName}`;
  const message = `Giai đoạn "${stageName}" đã quá hạn (${missedDays} ngày > ${safeDelayDays} ngày). Vui lòng hoàn thành hoặc chuyển giai đoạn thủ công.`;

  const notification = await Notification.create({
    user_id: userId,
    notebook_id: notebookId,
    type: "stage_overdue",
    title,
    message,
    metadata: {
      stage_number: stageNumber,
      stage_name: stageName,
      missed_days: missedDays,
      safe_delay_days: safeDelayDays,
      notebook_name: notebookName,
    },
  });

  console.log(
    `📧 Sent stage_overdue notification to user ${userId} for notebook ${notebookId}, stage ${stageNumber}`
  );

  return notification;
};

/**
 * Gửi thông báo stage hoàn thành
 */
export const sendStageCompletedNotification = async ({
  userId,
  notebookId,
  notebookName,
  stageNumber,
  stageName,
}) => {
  const title = `🎉 Hoàn thành giai đoạn: ${notebookName}`;
  const message = `Chúc mừng! Bạn đã hoàn thành giai đoạn "${stageName}". Tiếp tục chăm sóc cây để đạt kết quả tốt nhất.`;

  const notification = await Notification.create({
    user_id: userId,
    notebook_id: notebookId,
    type: "stage_completed",
    title,
    message,
    metadata: {
      stage_number: stageNumber,
      stage_name: stageName,
      notebook_name: notebookName,
    },
  });

  console.log(
    `📧 Sent stage_completed notification to user ${userId} for notebook ${notebookId}, stage ${stageNumber}`
  );

  return notification;
};

/**
 * Gửi thông báo nhắc nhở hàng ngày
 */
export const sendDailyReminderNotification = async ({
  userId,
  notebookId,
  notebookName,
  incompleteTasks,
}) => {
  const title = `🌱 Nhắc nhở: ${notebookName}`;
  const message = `Bạn có ${incompleteTasks} công việc chưa hoàn thành hôm nay. Đừng quên chăm sóc cây nhé!`;

  const notification = await Notification.create({
    user_id: userId,
    notebook_id: notebookId,
    type: "daily_reminder",
    title,
    message,
    metadata: {
      notebook_name: notebookName,
    },
  });

  console.log(
    `📧 Sent daily_reminder notification to user ${userId} for notebook ${notebookId}`
  );

  return notification;
};

/**
 * Lấy danh sách thông báo của user
 */
const getUserNotifications = async (userId, options = {}) => {
  const { limit = 50, skip = 0, is_read } = options;

  const filter = { user_id: userId };
  if (is_read !== undefined) {
    filter.is_read = is_read;
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate("notebook_id", "notebook_name plant_type cover_image");

  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({
    user_id: userId,
    is_read: false,
  });

  return {
    notifications,
    total,
    unread_count: unreadCount,
  };
};

/**
 * Đánh dấu thông báo đã đọc
 */
const markNotificationsAsRead = async (notificationIds) => {
  return Notification.markAsRead(notificationIds);
};

/**
 * Đánh dấu tất cả thông báo của user đã đọc
 */
const markAllAsRead = async (userId) => {
  return Notification.updateMany(
    { user_id: userId, is_read: false },
    { is_read: true, read_at: new Date() }
  );
};

/**
 * Xóa thông báo
 */
const deleteNotification = async (notificationId, userId) => {
  return Notification.findOneAndDelete({
    _id: notificationId,
    user_id: userId,
  });
};

/**
 * Cleanup thông báo cũ
 */
const cleanupOldNotifications = async (daysOld = 30) => {
  return Notification.cleanupOldNotifications(daysOld);
};

// ==========================================
// CONTROLLER EXPORTS
// ==========================================

/**
 * @route GET /api/notifications
 * @desc Lấy danh sách thông báo của user
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { limit, skip, is_read } = req.query;

  const options = {
    limit: limit ? parseInt(limit) : 50,
    skip: skip ? parseInt(skip) : 0,
  };

  if (is_read !== undefined) {
    options.is_read = is_read === "true";
  }

  const result = await getUserNotifications(req.user.id, options);

  return ok(
    res,
    result.notifications,
    {
      total: result.total,
      unread_count: result.unread_count,
      limit: options.limit,
      skip: options.skip,
    },
    "Notifications fetched successfully"
  );
});

/**
 * @route GET /api/notifications/unread-count
 * @desc Lấy số lượng thông báo chưa đọc
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await getUserNotifications(req.user.id, { limit: 0 });

  return ok(
    res,
    { unread_count: result.unread_count },
    null,
    "Unread count fetched successfully"
  );
});

/**
 * @route PATCH /api/notifications/mark-read
 * @desc Đánh dấu các thông báo đã đọc
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { notification_ids } = req.body;

  if (!notification_ids || !Array.isArray(notification_ids)) {
    return res.status(400).json({
      success: false,
      message: "notification_ids is required and must be an array",
    });
  }

  await markNotificationsAsRead(notification_ids);

  return ok(res, null, null, "Notifications marked as read successfully");
});

/**
 * @route PATCH /api/notifications/mark-all-read
 * @desc Đánh dấu tất cả thông báo của user đã đọc
 */
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await markAllAsRead(req.user.id);

  return ok(res, null, null, "All notifications marked as read successfully");
});

/**
 * @route DELETE /api/notifications/:id
 * @desc Xóa một thông báo
 */
export const removeNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await deleteNotification(id, req.user.id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Notification not found or already deleted",
    });
  }

  return ok(res, null, null, "Notification deleted successfully");
});

/**
 * @route POST /api/notifications/cleanup
 * @desc Cleanup old notifications (admin only)
 */
export const cleanupOld = asyncHandler(async (req, res) => {
  const { days } = req.body;
  const daysOld = days ? parseInt(days) : 30;

  const result = await cleanupOldNotifications(daysOld);

  return ok(
    res,
    { deleted_count: result.deletedCount },
    null,
    `Cleaned up notifications older than ${daysOld} days`
  );
});
