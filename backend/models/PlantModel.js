import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const PlantModelSchema = new mongoose.Schema(
  {
    model_id: { type: String, default: () => uuidv4(), index: true, unique: true },
    expert_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    description: { type: String },
    steps: [
      {
        title: { type: String },
        text: { type: String },
        image: { type: String },
      },
    ],
    images: [{ type: String }],
    plantTags: [{ type: String }],
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    duration: { type: String },
    expectedYield: { type: String },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

const PlantModel = mongoose.model("PlantModel", PlantModelSchema);
export default PlantModel;
