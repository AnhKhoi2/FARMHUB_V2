import mongoose from "mongoose";
import Expert from "../models/Expert.js";
import User from "../models/User.js";
import ExpertApplication from "../models/ExpertApplication.js";
import { sendMail } from "../utils/mailer.js";

// ===============================
// Admin list: GET /api/expert-applications?status=pending&q=&page=&limit=
// ===============================
export async function list(req, res) {
  try {
    const { status, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), "i");
      filter.$or = [{ full_name: rx }, { expertise_area: rx }, { description: rx }];
    }

    const items = await ExpertApplication.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await ExpertApplication.countDocuments(filter);
    return res
      .status(200)
      .json({ data: { items, total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error("List applications error:", err);
    return res.status(500).json({ error: "Failed to get applications" });
  }
}

// ===============================
// Mine: GET /api/expert-applications/mine
// (FE gọi expertApplicationApi.getMine())
// ===============================
export async function getMine(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // ⬇️ đổi userId -> user
    const apps = await ExpertApplication.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ data: apps });
  } catch (err) {
    console.error("Get my applications error:", err);
    return res.status(500).json({ error: "Failed to get your applications" });
  }
}


// ===============================
// Detail: GET /api/expert-applications/:id
// ===============================
export async function getById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid application id" });
    }
    const app = await ExpertApplication.findById(id).lean();
    if (!app) return res.status(404).json({ error: "Application not found" });
    return res.status(200).json({ data: app });
  } catch (err) {
    console.error("Get application error:", err);
    return res.status(500).json({ error: "Failed to get application detail" });
  }
}

// ===============================
// Create (user submit):
// POST /api/expert-applications
// body: { full_name, expertise_area, experience_years, description, phone_number, certificates[] }
// FE mong: thiếu field → 422 + { message, errors:{...} }
//         trùng pending → 409 + { message }
// ===============================
export async function create(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Không tìm thấy user" });

    const {
      full_name,
      expertise_area,
      experience_years = 0,
      description = "",
      phone_number = "",
      certificates = [],
    } = req.body || {};

    const errors = {};
    if (!full_name || !String(full_name).trim())
      errors.full_name = "Họ tên là bắt buộc";
    if (!expertise_area || !String(expertise_area).trim())
      errors.expertise_area = "Lĩnh vực là bắt buộc";
    if (Object.keys(errors).length) {
      return res.status(422).json({
        message: "Vui lòng kiểm tra các trường bắt buộc.",
        errors,
      });
    }

    // ⬇️ kiểm tra pending theo field user
    const existing = await ExpertApplication.findOne({ user: userId, status: "pending" });
    if (existing) {
      return res.status(409).json({ message: "Bạn đã có đơn đang chờ duyệt." });
    }

    const certs = Array.isArray(certificates)
      ? certificates.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean)
      : [];

    // ⬇️ tạo mới với field user
    const app = await ExpertApplication.create({
      user: userId,
      email: user.email,
      full_name: String(full_name).trim(),
      expertise_area: String(expertise_area).trim(),
      experience_years: Number.isFinite(Number(experience_years)) ? Number(experience_years) : 0,
      description,
      phone_number,
      certificates: certs,
      status: "pending",
    });

    try {
      await sendMail({
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: "FarmHub - Đơn đăng ký Expert mới",
        html: `
          <p>Xin chào Admin,</p>
          <p>Người dùng <b>${user.fullName || user.username}</b> (${user.email}) đã nộp đơn đăng ký trở thành Expert.</p>
          <p>Vui lòng vào trang quản trị để duyệt đơn.</p>
          <p>— FarmHub System</p>
        `,
      });
    } catch (e) {
      console.warn("sendMail ADMIN failed:", e?.message);
    }

    return res.status(201).json({ message: "Đã nộp đơn thành công", data: app });
  } catch (err) {
    console.error("Create expert application error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}


// ===============================
// Approve: PATCH /api/expert-applications/:id/approve
// Lưu ý: dùng userId thay cho user
// ===============================
export async function approve(req, res) {
  try {
    const { id } = req.params;
    const { activate_expert = true, review_notes = "" } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const app = await ExpertApplication.findById(id);
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.status && app.status !== "pending") {
      return res.status(400).json({ error: "Only pending applications can be approved" });
    }

    const payload = {
      // ⬇️ dùng app.user (không phải app.userId)
      user: app.user,
      full_name: app.full_name,
      phone_number: app.phone_number || null,
      expertise_area: app.expertise_area,
      experience_years: app.experience_years || 0,
      certificates: Array.isArray(app.certificates)
        ? app.certificates.map((c) => (typeof c === "string" ? { url: c } : c))
        : [],
      description: app.description || "",
      review_status: "approved",
      is_public: !!activate_expert,
      review_notes: review_notes || "",
    };

    const expert = await Expert.findOneAndUpdate(
      { user: app.user, is_deleted: false },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const updatedUser = await User.findByIdAndUpdate(app.user, { role: "expert" }, { new: true });

    if (updatedUser?.email) {
      try {
        await sendMail({
          to: updatedUser.email,
          subject: "FarmHub - Đơn đăng ký Expert đã được duyệt",
          html: `
            <p>Xin chào ${updatedUser.fullName || updatedUser.username},</p>
            <p>Chúc mừng! Đơn đăng ký trở thành Expert của bạn đã được duyệt 🎉</p>
            <p>Bạn có thể đăng nhập lại để bắt đầu sử dụng quyền Expert.</p>
            <p>— FarmHub Team</p>
          `,
        });
      } catch (e) {
        console.warn("sendMail USER failed:", e?.message);
      }
    }

    // Xoá đơn sau khi duyệt (hoặc đổi status='approved' nếu muốn giữ lịch sử)
    await ExpertApplication.findByIdAndDelete(id);

    return res.status(200).json({
      message:
        "Application approved, expert profile created, and user role updated to expert.",
      expert,
    });
  } catch (err) {
    console.error("Approve application error:", err);
    return res.status(500).json({ error: "Failed to approve application" });
  }
}


// ===============================
// Reject: PATCH /api/expert-applications/:id/reject
// Đồng bộ field 'reject_reason' theo schema
// ===============================
export async function reject(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const application = await ExpertApplication.findById(id);
    if (!application) return res.status(404).json({ error: "Không tìm thấy đơn" });

    // ⬇️ user từ application.user
    const user = await User.findById(application.user);
    if (!user) return res.status(404).json({ error: "Không tìm thấy user" });

    await ExpertApplication.findByIdAndUpdate(id, {
      status: "rejected",
      reject_reason: reason || "",
    });

    try {
      await sendMail({
        to: user.email,
        subject: "FarmHub - Đơn đăng ký Expert bị từ chối",
        html: `
          <p>Xin chào ${user.fullName || user.username},</p>
          <p>Rất tiếc, đơn đăng ký Expert của bạn đã bị từ chối.</p>
          ${reason ? `<p><b>Lý do:</b> ${reason}</p>` : ""}
          <p>Bạn có thể chỉnh sửa hồ sơ và nộp lại trong tương lai.</p>
          <p>— FarmHub Team</p>
        `,
      });
    } catch (e) {
      console.warn("sendMail USER failed:", e?.message);
    }

    res.json({ message: "Đã từ chối đơn." });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

