import mongoose from "mongoose";
const { Schema, model } = mongoose;

/* ========================== Subschema: Ảnh bệnh ========================== */
const DiseaseImage = new Schema(
  {
    url: { type: String, required: true, trim: true },
    caption: { type: String, trim: true },
  },
  { _id: false }
);

/* ========================== Subschema: Phương pháp điều trị ========================== */
const Treatments = new Schema(
  {
    technical: { type: String, trim: true },
    biological: { type: String, trim: true },
    chemical: { type: String, trim: true },
  },
  { _id: false }
);

/* ========================== Subschema: Locale ========================== */
const Locale = new Schema(
  {
    vi: { type: Boolean, default: true },
    en: { type: Boolean, default: false },
  },
  { _id: false }
);

/* ========================== Schema chính: Disease ========================== */
const DiseaseSchema = new Schema(
  {
    slug: { type: String, unique: true, index: true, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    scientificName: { type: String, trim: true },
    aliases: [{ type: String, trim: true }],
    category: {
      type: String,
      enum: ["fungal", "bacterial", "viral", "pest", "physiological"],
      index: true,
    },
    plantTypes: [{ type: String, index: true, trim: true }],
    severity: { type: String, enum: ["low", "medium", "high"], index: true },
    symptoms: { type: String, trim: true },
    images: [DiseaseImage],
    causes: { type: String, trim: true },
    treatments: Treatments,
    prevention: [{ type: String, trim: true }],
    references: [{ type: String, trim: true }],
    locale: Locale,
    lastUpdated: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

DiseaseSchema.index({
  name: "text",
  scientificName: "text",
  aliases: "text",
  symptoms: "text",
  causes: "text",
});

DiseaseSchema.on("index", (err) => {
  if (err) console.error("Disease index error:", err);
});

export default model("Disease", DiseaseSchema);
