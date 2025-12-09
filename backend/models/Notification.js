import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // `notebook_id` is optional for system-level notifications (e.g., subscription updates)
    notebook_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notebook",
      required: false,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "stage_warning", // Cảnh báo trễ
        "stage_overdue", // Quá hạn (cần can thiệp)
        "stage_skipped", // Stage đã bị skip
        "stage_completed", // Stage hoàn thành
        "daily_reminder", // Nhắc nhở hàng ngày
        "daily_tasks_generated", // Thông báo khi daily tasks đã được sinh
        "observation_required", // Yêu cầu quan sát chưa hoàn thành
        "subscription_upgrade", // Thông báo khi nâng gói
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      // existing fields for notebook related notifications
      stage_number: { type: Number },
      stage_name: { type: String },
      // NOTE: missed_days / safe_delay_days removed — no longer generated
      notebook_name: { type: String },
      // fields for subscription notification
      plan: { type: String },
      plan_name: { type: String },
      expires: { type: Date },
      order_ref: { type: String },
      amount: { type: Number },
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    read_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ user_id: 1, createdAt: -1 });
NotificationSchema.index({ user_id: 1, is_read: 1 });
NotificationSchema.index({ notebook_id: 1, type: 1 });

// Static method: Đánh dấu đã đọc
NotificationSchema.statics.markAsRead = async function (notificationIds) {
  return this.updateMany(
    { _id: { $in: notificationIds } },
    { is_read: true, read_at: new Date() }
  );
};

// Static method: Xóa thông báo cũ (cleanup)
NotificationSchema.statics.cleanupOldNotifications = async function (
  daysOld = 30
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    is_read: true,
  });
};

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
