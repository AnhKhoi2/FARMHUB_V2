import mongoose from "mongoose";

const PlantEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String },
    growth_period: {
      min_days: Number,
      max_days: Number,
      unit: { type: String, default: "days" },
    },
  },
  { _id: false }
);

const PlantGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    plants: { type: [PlantEntrySchema], default: [] },
  },
  { timestamps: true }
);

const PlantGroup = mongoose.model("PlantGroup", PlantGroupSchema);
export default PlantGroup;
