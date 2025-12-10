import mongoose from "mongoose";
import { getDaysDifferenceVN } from "../utils/timezone.js";

// Schema cho daily checklist item
const DailyChecklistItemSchema = new mongoose.Schema(
  {
    task_name: { type: String, required: true },
    description: { type: String },
    is_completed: { type: Boolean, default: false },
    completed_at: { type: Date },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    frequency: {
      type: String,
      enum: ["daily", "every_2_days", "every_3_days", "weekly", "once"],
      default: "daily",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "overdue", "skipped"],
      default: "pending",
    },
    overdue_at: { type: Date },
  },
  { _id: false }
);

// Schema cho stage tracking
const StageTrackingSchema = new mongoose.Schema(
  {
    stage_number: { type: Number, required: true },
    stage_name: { type: String, required: true },
    started_at: { type: Date },
    completed_at: { type: Date },
    is_current: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "completed", "overdue", "skipped"],
      default: "active",
    },
    // Track số ngày đã trễ so với stage end day
    // NOTE: 'missed_days' and 'notifications_sent' removed —
    // auto-skip / missed-day based notification logic has been deprecated.
    // Track tất cả tasks đã hoàn thành trong stage này
    completed_tasks: [
      {
        task_name: { type: String },
        completed_at: { type: Date },
      },
    ],
    observations: [
      {
        key: { type: String },
        value: { type: Boolean }, // true/false cho observation
        observed_at: { type: Date },
      },
    ],
    // Track daily progress (mới thêm)
    daily_logs: [
      {
        date: { type: Date, required: true },
        daily_progress: { type: Number, default: 0, min: 0, max: 100 }, // % hoàn thành ngày đó
      },
    ],
    // Track overdue tasks for this stage (persisted so frontend can fetch details)
    overdue_tasks: [
      {
        task_name: { type: String },
        description: { type: String },
        original_date: { type: Date },
        status: {
          type: String,
          enum: ["pending", "completed", "overdue", "skipped"],
          default: "overdue",
        },
        overdue_at: { type: Date },
        skipped_at: { type: Date },
      },
    ],
    // Track overdue tasks summary
    overdue_summary: {
      date: { type: Date }, // Ngày có tasks overdue
      overdue_count: { type: Number, default: 0 },
      ready_to_notify: { type: Boolean, default: false },
      notified_at: { type: Date },
    },
    // Track pending transition (khi hoàn thành observations, chờ chuyển stage vào ngày mai)
    pending_transition: { type: Boolean, default: false },
    transition_date: { type: Date }, // Ngày hoàn thành observations
  },
  { _id: false }
);

const notebookSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    guide_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guide", // liên kết tới hướng dẫn trồng
      required: false, // false để linh hoạt
    },

    // Liên kết với PlantTemplate
    template_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlantTemplate",
      required: false,
    },

    notebook_name: { type: String, required: true, maxlength: 100 },
    plant_type: { type: String, required: true },

    // Nhóm cây (để mapping với PlantTemplate)
    plant_group: {
      type: String,
      enum: [
        "leaf_vegetable",
        "root_vegetable",
        "fruit_short_term",
        "fruit_long_term",
        "bean_family",
        "herb",
        "flower_vegetable",
        "other",
      ],
      default: "other",
      index: true,
    },

    // Ngày trồng (quan trọng để tính stage)
    planted_date: { type: Date, default: Date.now },
    // Ngày trồng theo múi giờ Việt Nam (string: YYYY-MM-DD HH:mm:ss) để hiển thị trực tiếp
    planted_date_vn: { type: String },

    cover_image: { type: String },
    description: { type: String },
    progress: { type: Number, default: 0 },
    images: [{ type: String }], // Mảng chứa các URL/path ảnh

    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active",
    },

    // Thời gian xóa mềm (cho soft delete)
    deletedAt: { type: Date },

    // Stage tracking (theo dõi giai đoạn)
    current_stage: { type: Number, default: 1 },
    stages_tracking: [StageTrackingSchema],

    // Daily checklist (được auto-generate từ template)
    daily_checklist: [DailyChecklistItemSchema],

    // Last checklist generation date
    last_checklist_generated: { type: Date },
    // Last checklist generation date as Vietnam datetime string for direct display
    last_checklist_generated_vn: { type: String },

    // Số ngày đã trồng
    days_planted: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field: Tính số ngày từ khi trồng (theo giờ Việt Nam UTC+7)
notebookSchema.virtual("current_day").get(function () {
  if (!this.planted_date) return 0;
  // getDaysDifferenceVN returns 0 when planted_date is today.
  // Make the first planted day = 1 so observations tied to day_end
  // appear on the intended final day of the stage.
  const diffDays = getDaysDifferenceVN(this.planted_date, new Date());
  // Convert to 1-based day count; clamp to 0 for future planted_date
  return Math.max(0, diffDays + 1);
});

// Method: Cập nhật progress dựa trên các stage đã hoàn thành + stage hiện tại
notebookSchema.methods.updateProgress = async function (templateStages) {
  if (!templateStages || templateStages.length === 0) return 0;

  // Populate template nếu chưa có
  if (!this.populated("template_id")) {
    await this.populate("template_id");
  }

  let totalProgress = 0;

  // Distribute 100% equally across stages to avoid rounding issues.
  // Example: n=3 -> base=33, remainder=1 -> weights = [34,33,33]
  const nStages = templateStages.length;
  const base = Math.floor(100 / nStages);
  const remainder = 100 - base * nStages;
  const defaultWeights = templateStages.map(
    (_, i) => base + (i < remainder ? 1 : 0)
  );

  console.log("📊 Calculating plant progress (equal stage weights)...");
  // Duyệt qua từng stage trong template
  for (let i = 0; i < templateStages.length; i++) {
    const templateStage = templateStages[i];
    // Use equal-distributed weight for each stage to ensure total sums to 100%.
    const stageWeight = defaultWeights[i];
    const trackingStage = this.stages_tracking.find(
      (s) => s.stage_number === templateStage.stage_number
    );

    if (trackingStage && trackingStage.completed_at) {
      // Stage đã hoàn thành → cộng full weight
      totalProgress += stageWeight;
      console.log(
        `   ✅ Stage ${templateStage.stage_number} (${templateStage.name}): +${stageWeight}% (Completed)`
      );
    } else if (trackingStage && trackingStage.is_current) {
      // Stage hiện tại → cộng phần dựa trên completion của stage
      try {
        const stageCompletion = await this.getCurrentStageCompletion();
        const partial = Math.round(
          (stageWeight * (stageCompletion || 0)) / 100
        );
        totalProgress += partial;
        console.log(
          `   🔄 Stage ${templateStage.stage_number} (${templateStage.name}): +${partial}% (partial, ${stageCompletion}% of ${stageWeight}%)`
        );
      } catch (err) {
        console.warn("⚠️ Error getting current stage completion:", err);
      }
    } else {
      console.log(
        `   ⏳ Stage ${templateStage.stage_number} (${templateStage.name}): 0% (Not started yet)`
      );
    }
  }

  this.progress = Math.min(100, Math.round(totalProgress));
  // Clamp to [0,100] and ensure integer
  this.progress = Math.max(0, Math.min(100, Math.round(totalProgress)));
  console.log(`🌱 Total plant progress: ${this.progress}%`);

  return this.progress;
};

// Method: Tính % hoàn thành core tasks của stage hiện tại
notebookSchema.methods.getCurrentStageCompletion = async function () {
  // Populate template nếu chưa có
  if (!this.populated("template_id")) {
    await this.populate("template_id");
  }

  if (!this.template_id || !this.template_id.stages) {
    console.log("⚠️ No template or stages found");
    return 0;
  }

  // Tìm stage hiện tại trong template
  const currentStageIndex = this.current_stage - 1;
  const currentTemplateStage = this.template_id.stages[currentStageIndex];

  if (!currentTemplateStage) {
    console.log(`⚠️ No template stage found for stage ${this.current_stage}`);
    return 0;
  }

  // Lấy duration (số ngày) của stage
  const durationDays =
    currentTemplateStage.day_end - currentTemplateStage.day_start + 1;
  console.log(
    `📏 Stage duration: ${durationDays} days (${currentTemplateStage.day_start}-${currentTemplateStage.day_end})`
  );

  if (durationDays <= 0) return 0;

  // Tìm stage tracking hiện tại
  const currentStageTracking = this.stages_tracking.find(
    (s) => s.stage_number === this.current_stage
  );

  if (!currentStageTracking) {
    console.log(`⚠️ No stage_tracking found for stage ${this.current_stage}`);
    return 0;
  }

  // Nếu stage đã completed thì trả về 100%
  if (currentStageTracking.status === "completed") {
    return 100;
  }

  if (
    !currentStageTracking.daily_logs ||
    currentStageTracking.daily_logs.length === 0
  ) {
    console.log(`⚠️ No daily_logs found for stage ${this.current_stage}`);
    return 0;
  }

  console.log(
    `📊 Found ${currentStageTracking.daily_logs.length} daily_logs for stage ${this.current_stage}`
  );

  // Tính tổng daily_progress của tất cả các ngày
  const totalDailyProgress = currentStageTracking.daily_logs.reduce(
    (sum, log) => {
      console.log(
        `   - ${log.date?.toISOString().split("T")[0]}: ${log.daily_progress}%`
      );
      return sum + (log.daily_progress || 0);
    },
    0
  );

  console.log(`📈 Total daily progress: ${totalDailyProgress}%`);

  // Stage progress = (tổng daily_progress) / duration_days
  // Example: Day1:100%, Day2:50%, Duration:7 -> (100+50)/7 = 21.43%
  const raw = Math.round(totalDailyProgress / durationDays);
  // Clamp to [0,100]
  const clamped = Math.max(0, Math.min(100, raw));
  console.log(`📊 Stage completion (clamped): ${clamped}%`);
  return clamped;
};

// Index
notebookSchema.index({ user_id: 1, status: 1 });
notebookSchema.index({ template_id: 1 });
notebookSchema.index({ planted_date: 1 });

export default mongoose.model("Notebook", notebookSchema);
