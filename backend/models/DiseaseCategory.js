import mongoose from "mongoose";
const { Schema, model } = mongoose;

const DiseaseCategorySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String, trim: true },
    order: { type: Number, default: 0, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

DiseaseCategorySchema.index({ name: "text", description: "text" });

DiseaseCategorySchema.on("index", (err) => {
  if (err) console.error("DiseaseCategory index error:", err);
});

export default model("DiseaseCategory", DiseaseCategorySchema, "disease_categories");
