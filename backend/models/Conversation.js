import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    // Hai thực thể chính
    user:   { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },
    expert: { type: mongoose.Schema.Types.ObjectId, ref: "Expert", required: true },

    // Hai user tham gia: user._id và expert.user._id
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    ],

    pairKey:    { type: String, required: true, unique: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    last_message: {
      text:   { type: String, default: "" },
      at:     { type: Date,   default: null },
      // ✅ luôn là User (kể cả chuyên gia) → dùng expert.user
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
    }
  },
  { timestamps: true }
);

// Exactly 2 participants
ConversationSchema.path("participants").validate(function (arr) {
  return Array.isArray(arr) && arr.length === 2;
}, "Conversation must contain exactly 2 participants");

// Auto build pairKey from participants
ConversationSchema.pre("validate", function (next) {
  if (Array.isArray(this.participants) && this.participants.length === 2) {
    const [a, b] = this.participants.map(String).sort();
    this.pairKey = `${a}_${b}`;
  }
  next();
});

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ expert: 1, updatedAt: -1 });

const Conversation = mongoose.model("Conversation", ConversationSchema);
export default Conversation;
