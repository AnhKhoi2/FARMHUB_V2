import Profile from "../models/Profile.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";

function emptyProfile(userId) {
  return {
    _id: undefined,
    userId,
    fullName: "",
    avatar: "",
    phone: "",
    dob: null,
    gender: "other",
    address: "",
    bio: "",
    createdAt: undefined,
    updatedAt: undefined,
  };
}

export const profileController = {
  getProfile: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const profileDoc = await Profile.findOne({ userId }).lean();

    // ✅ lấy thêm provider + password để tính hasPassword (không trả password ra ngoài)
    const userRaw = await User.findById(userId)
      .select("email username provider password")
      .lean();

    const hasPassword = Boolean(userRaw?.password);
    const { password, ...user } = userRaw || {};

    const profile = profileDoc || emptyProfile(userId);

    return ok(res, { ...profile, user, hasPassword });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = req.validated || req.body; // ưu tiên dữ liệu đã qua Joi

    // Chuẩn hoá dob → ISO (nếu có)
    if (data.dob) {
      const dt = new Date(data.dob);
      if (!Number.isNaN(dt.getTime())) data.dob = dt.toISOString();
    }

    const updated = await Profile.findOneAndUpdate(
      { userId },
      { $set: { ...data, userId } },
      { new: true, upsert: true } // upsert để tạo mới nếu chưa tồn tại
    ).lean();

    return ok(res, updated);
  }),
};
