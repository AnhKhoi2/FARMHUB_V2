// ===============================
//  FARMHUB - Expert Controller (service-merged; no add/edit)
// ===============================
import mongoose from "mongoose";
import Expert from "../models/Expert.js";
import User from "../models/User.js";

// ---------- Helpers ----------
const ALLOWED_REVIEW = ["pending", "approved", "rejected", "banned", "inactive"];

// Dùng "+user" để chắc chắn field user được include dù schema có select:false
const PROJECTION =
  "+user expert_id full_name expertise_area experience_years certificates description avg_score total_reviews review_status is_public phone_number created_at updated_at";

// ===============================
// GET /api/experts?q=&review_status=&min_exp=&max_exp=&is_public=
// ===============================
export async function list(req, res) {
  try {
    const { q, review_status, min_exp, max_exp, is_public } = req.query || {};
    const filter = { is_deleted: false };

    if (review_status && ALLOWED_REVIEW.includes(review_status)) {
      filter.review_status = review_status;
    }

    if (typeof is_public !== "undefined") {
      if (is_public === "true" || is_public === true) filter.is_public = true;
      if (is_public === "false" || is_public === false) filter.is_public = false;
    }

    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), "i");
      filter.$or = [{ full_name: rx }, { expertise_area: rx }, { description: rx }];
    }

    const min = Number(min_exp);
    const max = Number(max_exp);
    if (!Number.isNaN(min) || !Number.isNaN(max)) {
      filter.experience_years = {};
      if (!Number.isNaN(min)) filter.experience_years.$gte = min;
      if (!Number.isNaN(max)) filter.experience_years.$lte = max;
    }

    const items = await Expert.find(filter)
      .select(PROJECTION)
      .select("+user")
      .populate({
        path: "user",
        select: "email role avatar isVerified isDeleted"
      })
      .lean();

    // 🟢 FIXED: Trả avatar ra root level để FE không bị undefined
    items.forEach(e => {
      e.avatar = e.user?.avatar || "";
    });

    return res.status(200).json({ data: items });
  } catch (err) {
    console.error("List experts error:", err);
    return res.status(500).json({ error: "Failed to get experts" });
  }
}


// ===============================
// GET /api/experts/:id   (accepts expert_id or _id)
// ===============================
export async function getById(req, res) {
  try {
    const id = (req.params.id || "").trim();
    const orConds = [{ expert_id: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      orConds.push({ _id: new mongoose.Types.ObjectId(id) });
    }

    const expert = await Expert.findOne({ is_deleted: false, $or: orConds })
      .select(PROJECTION)
      .select("+user")
      .populate({ path: "user", select: "email role isVerified isDeleted" })
      .lean();

    if (!expert) return res.status(404).json({ error: "Expert not found" });
    return res.status(200).json({ data: expert });
  } catch (err) {
    console.error("Get expert error:", err);
    return res.status(500).json({ error: "Failed to get expert detail" });
  }
}

// ===============================
// DELETE /api/experts/:id
//  - Xóa mềm Expert
//  - Đồng thời vô hiệu hóa luôn User (isDeleted + isBanned)
// ===============================
export async function remove(req, res) {
  try {
    const rawId = (req.params.id || "").trim();

    // Cho phép xoá theo expert_id hoặc _id
    const orConds = [{ expert_id: rawId }];
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      orConds.push({ _id: new mongoose.Types.ObjectId(rawId) });
    }

    // 1) Tìm expert còn active
    const expert = await Expert.findOne({ is_deleted: false, $or: orConds });
    if (!expert) {
      return res.status(404).json({ error: "Expert not found to delete" });
    }

    // 2) Soft delete expert
    expert.is_deleted = true;
    expert.deleted_at = new Date();
    await expert.save();

    // 3) Soft delete luôn User tương ứng → tài khoản KHÔNG login được nữa
    if (expert.user) {
      await User.findByIdAndUpdate(
        expert.user,
        {
          isDeleted: true,
          isBanned: true, // tùy, có thể bỏ nếu không dùng
        },
        { new: true }
      );
    }

    return res.status(200).json({
      message: "Xóa mềm chuyên gia và vô hiệu hóa tài khoản thành công.",
    });
  } catch (err) {
    console.error("Soft delete expert error:", err);
    return res.status(500).json({ error: "Failed to delete expert" });
  }
}

// -------- Disabled stubs (giữ để tránh 404 route cũ) --------
export async function create(_req, res) {
  return res.status(405).json({ error: "Create is disabled" });
}
export async function update(_req, res) {
  return res.status(405).json({ error: "Update is disabled" });
}

// ===============================
// GET /api/experts/me/basic
// ===============================
export async function getMyBasic(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId)
      .select("username email role avatar isDeleted")
      .lean();

    if (!user || user.isDeleted) {
      return res.status(404).json({ error: "User not found" });
    }

    // 🔥 Log kiểm tra avatar đang có gì trong DB
    console.log(">>> USER BASIC:", user);

    const expert = await Expert.findOne({ user: userId, is_deleted: false })
      .select("full_name phone_number expertise_area")
      .lean();

    console.log(">>> EXPERT BASIC:", expert);

    const name =
      expert?.full_name ||
      user.username ||
      (user.email ? user.email.split("@")[0] : "Expert");

    const roleDisplay = expert?.expertise_area || "Chuyên gia nông nghiệp";
    const phone = expert?.phone_number || "";

    // 🎯 Avatar: chỉ trả đúng chuỗi avatar trong DB
    // ❗ KHÔNG return "" nếu avatar = null → FE sẽ tự xử lý.
    const avatar = user.avatar ?? "";

    return res.json({
      data: {
        name,
        email: user.email || "",
        role: roleDisplay,
        phone,
        avatar,           // giữ nguyên avatar gốc từ DB
        avatarSeed: "",   // bỏ seed
        notifications: 0,
      },
    });
  } catch (err) {
    console.error("getMyBasic error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}



// ===============================
// PUT /api/experts/me/basic
// body: { name?, role?, phone?, avatarSeed?, email? }
// ===============================
export async function updateMyBasic(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name, role, phone, email, avatar } = req.body || {};

    // Nếu không có bất kỳ dữ liệu nào để update
    if (
      (!name || !String(name).trim()) &&
      (!role || !String(role).trim()) &&
      (!phone || !String(phone).trim()) &&
      (!email || !String(email).trim()) &&
      (!avatar || !String(avatar).trim())
    ) {
      return res.status(400).json({ error: "Không có dữ liệu để cập nhật" });
    }

    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ error: "User not found" });
    }

    const expert = await Expert.findOne({ user: userId, is_deleted: false });
    if (!expert) {
      return res.status(404).json({ error: "Expert not found" });
    }

    // =====================
    // CẬP NHẬT TÊN
    // =====================
    if (name && String(name).trim()) {
      const cleaned = String(name).trim();
      user.username = cleaned;
      expert.full_name = cleaned;
    }

    // =====================
    // CẬP NHẬT SỐ ĐIỆN THOẠI
    // =====================
    if (phone && String(phone).trim()) {
      expert.phone_number = String(phone).trim();
    }

    // =====================
    // CẬP NHẬT VAI TRÒ
    // =====================
    if (role && String(role).trim()) {
      expert.expertise_area = String(role).trim();
    }

    // =====================
    // CẬP NHẬT AVATAR UPLOAD
    // =====================
    if (avatar && String(avatar).trim()) {
      user.avatar = String(avatar).trim();
    }

    // ❌ XÓA HOÀN TOÀN avatarSeed
    user.avatarSeed = "";

    // =====================
    // CẬP NHẬT EMAIL
    // =====================
    if (email && String(email).trim()) {
      const newEmail = String(email).trim();

      // validate mail
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return res
          .status(400)
          .json({ error: "Định dạng email không hợp lệ" });
      }

      // check trùng
      if (newEmail !== user.email) {
        const existed = await User.findOne({
          email: newEmail,
          _id: { $ne: userId },
        });
        if (existed) {
          return res
            .status(400)
            .json({ error: "Email này đã được sử dụng bởi tài khoản khác" });
        }
        user.email = newEmail;
      }
    }

    // LƯU USER + EXPERT
    await Promise.all([user.save(), expert.save()]);

    // =====================
    // BUILD RESPONSE
    // =====================
    const displayName =
      expert.full_name ||
      user.username ||
      (user.email ? user.email.split("@")[0] : "Expert");

    const displayRole = expert.expertise_area || "Chuyên gia nông nghiệp";
    const displayPhone = expert.phone_number || "";
    const displayEmail = user.email || "";

    // 🎯 KHÔNG DÙNG DICEBEAR, KHÔNG AVATAR SEED
    const displayAvatar =
      user.avatar && String(user.avatar).trim()
        ? user.avatar
        : "";

    return res.json({
      data: {
        name: displayName,
        email: displayEmail,
        role: displayRole,
        avatar: displayAvatar,
        avatarSeed: "",       // luôn trống
        phone: displayPhone,
        notifications: 0,
      },
    });
  } catch (err) {
    console.error("updateMyBasic error:", err);
    return res.status(500).json({ error: "Failed to update expert profile" });
  }
}

