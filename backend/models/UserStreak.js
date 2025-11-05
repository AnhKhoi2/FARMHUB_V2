import mongoose from "mongoose";
const { Schema } = mongoose;

const userStreakSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    current_streak: {
      type: Number,
      default: 0,
      required: true,
    },
    max_streak: {
      type: Number,
      default: 0,
      required: true,
    },
    last_login_date: {
      type: Date,
      default: null,
    },
    total_points: {
      type: Number,
      default: 0,
      required: true,
    },
    earned_badges: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const UserStreak = mongoose.model("UserStreak", userStreakSchema);
export default UserStreak;
