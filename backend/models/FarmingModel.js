// backend/models/UrbanFarmingPlan.js
import mongoose from "mongoose";

const urbanFarmingPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // JSON form mà người dùng gửi
    input: {
      type: Object,
      required: true,
    },

    // Kết quả AI trả về (schema như anh định nghĩa)
    aiResult: {
      type: Object,
      required: true,
    },

    // Dùng để hiển thị trong list (có thể cho user đặt tên sau)
    title: {
      type: String,
      trim: true,
    },

    // Có thể lưu thêm vài thông tin tóm tắt cho list
    climate_zone_vn: {
      type: String,
      enum: ["Miền Bắc", "Miền Trung", "Miền Nam", "Tây Nguyên", null],
      default: null,
    },
    main_model_id: {
      type: String, // vd: self-watering-container
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

const UrbanFarmingPlan = mongoose.model(
  "UrbanFarmingPlan",
  urbanFarmingPlanSchema
);

export default UrbanFarmingPlan;
