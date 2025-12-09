import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Gửi thông báo cảnh báo stage trễ (warning)
 */

/**
 * Gửi thông báo stage bị skip tự động
 */

/**
 * Gửi thông báo stage quá hạn (không auto_skip)
 */
// NOTE: Deprecated functions removed: stage-warning/overdue/skipped notifications
// These notification helpers were specific to missed-day / auto-skip logic and
// have been removed because the application no longer auto-skips stages based
// on missed days. Other notification helpers remain below.

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
 * Gửi thông báo khi daily tasks đã được sinh cho hôm nay
 */
export const sendDailyTasksGeneratedNotification = async ({
  userId,
  notebookId,
  notebookName,
  tasksCount,
}) => {
  const title = `🔔 Công việc hôm nay đã sẵn sàng: ${notebookName}`;
  const message = `Hệ thống đã tạo ${tasksCount} công việc cho hôm nay. Hãy mở nhật ký và hoàn thành nhé!`;

  const notification = await Notification.create({
    user_id: userId,
    notebook_id: notebookId,
    type: "daily_tasks_generated",
    title,
    message,
    metadata: {
      notebook_name: notebookName,
      tasks_count: tasksCount,
    },
  });

  console.log(
    `📧 Sent daily_tasks_generated notification to user ${userId} for notebook ${notebookId}`
  );

  return notification;
};

/**
 * Gửi thông báo khi một giai đoạn yêu cầu quan sát nhưng chưa đủ quan sát
 */
export const sendObservationRequiredNotification = async ({
  userId,
  notebookId,
  notebookName,
  stageNumber,
  stageName,
  requiredKeys = [],
  recordedKeys = [],
}) => {
  const title = `👁️ Yêu cầu quan sát: ${notebookName}`;

  const missing = requiredKeys.filter((k) => !recordedKeys.includes(k));
  const reqList = requiredKeys.length ? requiredKeys.join(", ") : "(none)";
  const recList = recordedKeys.length ? recordedKeys.join(", ") : "(none)";

  const message = `Giai đoạn "${stageName}" yêu cầu quan sát: ${reqList}. Bạn đã ghi: ${recList}. Thiếu: ${
    missing.length ? missing.join(", ") : "(không)"
  }. Vui lòng vào nhật ký để kiểm tra và cập nhật.`;

  const notification = await Notification.create({
    user_id: userId,
    notebook_id: notebookId,
    type: "observation_required",
    title,
    message,
    metadata: {
      stage_number: stageNumber,
      stage_name: stageName,
      notebook_name: notebookName,
      required_keys: requiredKeys,
      recorded_keys: recordedKeys,
      missing_keys: missing,
    },
  });

  console.log(
    `📧 Sent observation_required notification to user ${userId} for notebook ${notebookId}, stage ${stageNumber}`
  );

  return notification;
};

/**
 * Gửi thông báo khi notebook hoàn thành 100%
 */
export const sendNotebookCompletedNotification = async ({
  userId,
  notebookId,
  notebookName,
  plantType,
  totalDays,
}) => {
  const title = `🎉 Chúc mừng! Hoàn thành nhật ký: ${notebookName}`;
  const message = `Xuất sắc! Bạn đã hoàn thành toàn bộ quá trình trồng ${plantType} sau ${totalDays} ngày chăm sóc. Hãy xem lại kết quả và chia sẻ kinh nghiệm nhé!`;

  const notification = await Notification.create({
    user_id: userId,
    notebook_id: notebookId,
    type: "notebook_completed",
    title,
    message,
    metadata: {
      notebook_name: notebookName,
      plant_type: plantType,
      total_days: totalDays,
      completed_at: new Date(),
    },
  });

  console.log(
    `🎊 Sent notebook_completed notification to user ${userId} for notebook ${notebookId}`
  );

  return notification;
};

/**
 * Gửi thông báo khi user nâng cấp subscription thành công
 */
export const sendSubscriptionUpgradeNotification = async ({
  userId,
  plan,
  planName,
  expires,
  orderRef,
  amount,
}) => {
  const title = `🎉 Nâng cấp gói thành công: ${planName}`;
  const expiresText = expires
    ? new Date(expires).toLocaleString()
    : "(không xác định)";
  const message = `Bạn đã nâng cấp lên gói "${planName}" thành công. Hạn sử dụng đến ${expiresText}. Mã đơn: ${orderRef}. Số tiền: ${
    amount ? amount.toLocaleString("vi-VN") + " VND" : "(không rõ)"
  }.`;

  const notification = await Notification.create({
    user_id: userId,
    type: "subscription_upgrade",
    title,
    message,
    metadata: {
      plan,
      plan_name: planName,
      expires,
      order_ref: orderRef,
      amount,
    },
  });

  console.log(
    `📣 Sent subscription_upgrade notification to user ${userId}: plan=${plan}, order=${orderRef}`
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

/**
 * @route DELETE /api/notifications/clear
 * @desc Xóa tất cả thông báo của user hiện tại
 */
export const clearNotifications = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({ user_id: req.user.id });

  return ok(
    res,
    { deleted_count: result.deletedCount },
    null,
    `Cleared ${result.deletedCount} notifications for user`
  );
});
