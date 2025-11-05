import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, //tránh trùng lặp
      
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    // ✅ Thay thế 'admin: boolean' bằng 'role: string'
    role: { 
      type: String, 
      enum: ["user", "expert", "moderator", "admin"], 
      default: "user" 
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    refreshTokens: {
    type: [String],
    default: [],
   },
  },
  { timestamps: true } //create. update khi nào
);

const User = mongoose.model("User", userSchema)
export default User;