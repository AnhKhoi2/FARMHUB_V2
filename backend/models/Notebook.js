import mongoose from "mongoose";

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

    notebook_name: { type: String, required: true, maxlength: 100 },
    plant_type: { type: String, required: true },
    cover_image: { type: String },
    description: { type: String },
    progress: { type: Number, default: 0 },
    images: [{ type: String }], // Mảng chứa các URL/path ảnh
    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notebook", notebookSchema);
