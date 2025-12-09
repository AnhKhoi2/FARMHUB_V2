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

// Helper to create URL-friendly slugs from a name
function toSlug(s) {
  if (!s) return "";
  return String(s)
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // remove diacritics
    .replace(/[^\w\s-]/g, "") // remove invalid chars
    .trim()
    .replace(/[\s_]+/g, "-") // replace spaces/underscores with -
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

// Auto-generate slug from name if missing and guarantee uniqueness
PlantGroupSchema.pre("validate", async function (next) {
  try {
    if (!this.slug && this.name) {
      this.slug = toSlug(this.name);
    }

    // If slug is still empty, skip (validation will catch required)
    if (!this.slug) return next();

    const base = toSlug(this.slug || this.name);
    let candidate = base;
    let i = 0;

    // Ensure uniqueness by appending a counter when needed
    // Skip current document by _id when editing
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const conflict = await mongoose.models.PlantGroup.findOne({
        slug: candidate,
        _id: { $ne: this._id },
      }).exec();
      if (!conflict) break;
      i += 1;
      candidate = `${base}-${i}`;
    }
    this.slug = candidate;
    return next();
  } catch (err) {
    return next(err);
  }
});

const PlantGroup = mongoose.model("PlantGroup", PlantGroupSchema);
export default PlantGroup;
