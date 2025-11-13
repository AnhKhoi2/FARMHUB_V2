import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const GuideSchema = new mongoose.Schema(
  {
    guide_id: {
      type: String,
      default: () => uuidv4(),
      index: true,
      unique: true,
    },
    expert_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    description: { type: String },
    content: { type: String },
    tags: [{ type: String }],
    // main image (string path or URL)
    image: { type: String },
    // structured steps for the guide: each step can have text and an optional image
    steps: [
      {
        title: { type: String },
        text: { type: String },
        image: { type: String },
      },
    ],
    // plantTags: tags describing plant types / suitability (e.g., rau củ, trái cây ngắn hạn, suitable for apartment)
    plantTags: [{ type: String }],
    // Plant group for mapping with PlantTemplate
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
    // Tên cây cụ thể (ví dụ: "Xà lách", "Rau muống")
    plant_name: { type: String },
    // soft delete flag
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    // status enum
    status: {
      type: String,
      enum: ["draft", "pending", "published"],
      default: "draft",
    },
  },
  { timestamps: true }
);

const Guide = mongoose.model("Guide", GuideSchema);
export default Guide;
