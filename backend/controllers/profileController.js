// backend/controllers/profileController.js
import Profile from "../models/Profile.js";
import User from "../models/User.js";
import UserStreak from "../models/UserStreak.js";
import Model from "../models/Model.js";
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

/**
 * Validate custom payload cho updateProfile
 * KHÔNG dùng Joi.
 */
function validateProfilePayload(body = {}) {
  const errors = {};
  const cleaned = { ...body };

  // fullName: tối đa 100 ký tự (nếu có nhập)
  if (typeof cleaned.fullName === "string") {
    const fn = cleaned.fullName.trim();
    cleaned.fullName = fn;
    if (fn.length > 20) {
      errors.fullName = "Họ và tên tối đa 20 ký tự.";
    }
  }

  // SỐ ĐIỆN THOẠI: cho phép rỗng, nếu nhập thì phải 10 số, bắt đầu bằng 0
  if (typeof cleaned.phone === "string") {
    const phone = cleaned.phone.trim();
    cleaned.phone = phone;
    if (phone) {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(phone)) {
        errors.phone =
          "Số điện thoại không đúng định dạng (10 số, bắt đầu bằng 0).";
      }
    }
  }

  // ĐỊA CHỈ: tối đa 150 ký tự
  if (typeof cleaned.address === "string") {
    const addr = cleaned.address.trim();
    cleaned.address = addr;
    if (addr.length > 150) {
      errors.address = "Địa chỉ tối đa 150 ký tự.";
    }
  }

  // GIỚI THIỆU: tối đa 150 ký tự
  if (typeof cleaned.bio === "string") {
    const bio = cleaned.bio.trim();
    cleaned.bio = bio;
    if (bio.length > 150) {
      errors.bio = "Giới thiệu tối đa 150 ký tự.";
    }
  }

  // NGÀY SINH:
  // - không được là hôm nay / tương lai
  // - không được trong 9 năm đổ lại (user phải ≥ 10 tuổi)
  if (cleaned.dob) {
    const dt = new Date(cleaned.dob);
    if (Number.isNaN(dt.getTime())) {
      errors.dob = "Ngày sinh không hợp lệ.";
    } else {
      const today = new Date();
      const todayDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const dobDate = new Date(
        dt.getFullYear(),
        dt.getMonth(),
        dt.getDate()
      );

      if (dobDate >= todayDate) {
        errors.dob = "Ngày sinh không được là ngày hiện tại hoặc tương lai.";
      } else {
        const nineYearsAgo = new Date(
          todayDate.getFullYear() - 9,
          todayDate.getMonth(),
          todayDate.getDate()
        );
        if (dobDate > nineYearsAgo) {
          errors.dob =
            "Ngày sinh không được trong 9 năm đổ lại (người dùng phải từ 10 tuổi trở lên).";
        }
      }

      // Nếu DOB hợp lệ thì chuẩn hóa về ISO string
      if (!errors.dob) {
        cleaned.dob = dt.toISOString();
      }
    }
  }

  return { cleaned, errors };
}

export const profileController = {
  // GET /profile
  getProfile: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const profileDoc = await Profile.findOne({ userId }).lean();

    // lấy thêm provider + password để tính hasPassword (không trả password ra ngoài)
    const userRaw = await User.findById(userId)
      .select("email username provider password role profile")
      .lean();

    const hasPassword = Boolean(userRaw?.password);
    const { password, ...user } = userRaw || {};

    const profile = profileDoc || emptyProfile(userId);

    // ❌ KHÔNG còn ép profile.fullName = user.username
    // fullName sẽ lấy đúng từ document Profile (hoặc rỗng nếu chưa nhập)
    // FE có thể fallback sang username nếu muốn.

    // attach streak / badges info nếu có
    try {
      const streak = await UserStreak.findOne({ user: userId }).lean();
      profile.earned_badges = Array.isArray(streak?.earned_badges)
        ? streak.earned_badges
        : [];
      profile.total_points = streak?.total_points || 0;
      profile.current_streak = streak?.current_streak || 0;
    } catch (e) {
      profile.earned_badges = profile.earned_badges || [];
      profile.total_points = profile.total_points || 0;
      profile.current_streak = profile.current_streak || 0;
    }

    return ok(res, { ...profile, user, hasPassword });
  }),

  // PUT /profile
  updateProfile: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // 1️⃣ Validate custom (không dùng Joi)
    const { cleaned, errors } = validateProfilePayload(req.body || {});

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        message: "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.",
        errors,
      });
    }

    const data = cleaned;

    // ❌ KHÔNG ép fullName = username nữa
    // Nếu FE không gửi fullName -> trong DB sẽ giữ giá trị cũ (nếu có) hoặc rỗng.
    // Nếu FE gửi fullName -> cập nhật theo giá trị đó.

    // 2️⃣ Cập nhật (hoặc tạo mới) hồ sơ Profile
    const updatedProfile = await Profile.findOneAndUpdate(
      { userId },
      { $set: { ...data, userId } },
      { new: true, upsert: true }
    ).lean();

    // 3️⃣ Nếu có avatar mới -> đồng bộ avatar vào User.profile.avatar
    if (data.avatar) {
      await User.findByIdAndUpdate(userId, {
        $set: { "profile.avatar": data.avatar },
      });
    }

    // 4️⃣ Lấy lại thông tin user (không trả password)
    const userRaw = await User.findById(userId)
      .select("email username provider role profile")
      .lean();

    const user = userRaw || {};

    return ok(res, {
      profile: updatedProfile,
      user,
    });
  }),

  // GET /profile/model-suggestion
  getModelSuggestion: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const profileDoc = await Profile.findOne({ userId }).lean();

    const [
      soils,
      climates,
      irrigations,
      sunIntensities,
      winds,
      floorMaterials,
    ] = await Promise.all([
      Model.distinct("soil", { isDeleted: false }),
      Model.distinct("climate", { isDeleted: false }),
      Model.distinct("irrigation", { isDeleted: false }),
      Model.distinct("sunIntensity", { isDeleted: false }),
      Model.distinct("wind", { isDeleted: false }),
      Model.distinct("floorMaterial", { isDeleted: false }),
    ]);

    const options = {
      soil: soils.filter(Boolean),
      climate: climates.filter(Boolean),
      irrigation: irrigations.filter(Boolean),
      sunIntensity: sunIntensities.filter(Boolean),
      wind: winds.filter(Boolean),
      floorMaterial: floorMaterials.filter(Boolean),
      hasRoof: [true, false],
    };

    const modelSuggestion =
      (profileDoc && profileDoc.modelSuggestion) || {
        selectedOptions: {},
        skipCount: 0,
        lastSkippedAt: null,
      };

    return ok(res, { options, modelSuggestion });
  }),

  // POST /profile/model-suggestion/select
  selectModelSuggestion: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = req.body || {};

    const selectedOptions = data.selectedOptions || {};

    const updated = await Profile.findOneAndUpdate(
      { userId },
      {
        $set: {
          "modelSuggestion.selectedOptions": selectedOptions,
          "modelSuggestion.skipCount": 0,
          "modelSuggestion.lastSkippedAt": null,
        },
      },
      { new: true, upsert: true }
    ).lean();

    return ok(res, { modelSuggestion: updated.modelSuggestion });
  }),

  // POST /profile/model-suggestion/skip
  skipModelSuggestion: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const updated = await Profile.findOneAndUpdate(
      { userId },
      {
        $inc: { "modelSuggestion.skipCount": 1 },
        $set: { "modelSuggestion.lastSkippedAt": new Date() },
      },
      { new: true, upsert: true }
    ).lean();

    return ok(res, { modelSuggestion: updated.modelSuggestion });
  }),
};
