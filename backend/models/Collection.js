import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    collection_name: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },

    description: {
      type: String,
      maxlength: 500,
      trim: true,
    },

    cover_image: {
      type: String,
      default: "",
    },

    notebooks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notebook",
      },
    ],

    is_public: {
      type: Boolean,
      default: false,
    },

    tags: [
      {
        type: String,
        maxlength: 50,
      },
    ],

    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Index cho tìm kiếm
collectionSchema.index({
  collection_name: "text",
  description: "text",
  tags: "text",
});
collectionSchema.index({ user_id: 1, status: 1 });
collectionSchema.index({ user_id: 1, createdAt: -1 });

export default mongoose.model("Collection", collectionSchema);
