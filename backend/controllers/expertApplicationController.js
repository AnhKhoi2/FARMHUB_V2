// backend/controllers/expertApplicationController.js
import mongoose from "mongoose";
import Expert from "../models/Expert.js";
import User from "../models/User.js";
import ExpertApplication from "../models/ExpertApplication.js";
import { sendMail } from "../utils/mailer.js";

// Tạo model tạm cho expertapplications nếu bạn chưa có schema riêng (strict:false để nhận mọi field)
// Model chuẩn đã có trong models/ExpertApplication.js

// GET /api/expert-applications?status=pending&q=...
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
    return res.status(200).json({ data: { items, total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error("List applications error:", err);
    return res.status(500).json({ error: "Failed to get applications" });
  }
}

// GET /api/expert-applications/me  (xem đơn của chính user đang đăng nhập)
export async function getMine(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const apps = await ExpertApplication.find({ user: userId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ data: apps });
  } catch (err) {
    console.error("Get my applications error:", err);
    return res.status(500).json({ error: "Failed to get your applications" });
  }
}

// GET /api/expert-applications/:id
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

// POST /api/expert-applications  (user tự nộp đơn xin xét duyệt)
export const create = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Không tìm thấy user" });

    // Kiểm tra đơn đang chờ
    const existing = await ExpertApplication.findOne({ user: userId, status: "pending" });
    if (existing)
      return res.status(400).json({ error: "Bạn đã có đơn đang chờ duyệt." });

    // Tạo mới
    const app = new ExpertApplication({
      ...req.body,
      user: userId,
      email: user.email,
      status: "pending",
    });
    await app.save();

    // 🔔 Gửi email cho admin
    await sendMail({
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER, // bạn có thể set ADMIN_EMAIL riêng
      subject: "FarmHub - Đơn đăng ký Expert mới",
      html: `
        <p>Xin chào Admin,</p>
        <p>Người dùng <b>${user.fullName || user.username}</b> (${user.email}) đã nộp đơn đăng ký trở thành Expert.</p>
        <p>Vui lòng truy cập trang quản trị để xem và duyệt đơn.</p>
        <p>— FarmHub System</p>
      `,
    });

    return res.status(201).json({ message: "Đã nộp đơn thành công", data: app });
  } catch (err) {
    console.error("Create expert application error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH /api/expert-applications/:id/approv
export async function approve(req, res) {
  try {
    const { id } = req.params;
    const { activate_expert = true, review_notes = "" } = req.body || {};

    // 1️⃣ Kiểm tra id hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    // 2️⃣ Tìm đơn
    const app = await ExpertApplication.findById(id);
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.status && app.status !== "pending") {
      return res.status(400).json({ error: "Only pending applications can be approved" });
    }

    // 3️⃣ Chuẩn hóa dữ liệu Expert
    const payload = {
      user: app.user,
      full_name: app.full_name,
      phone_number: app.phone_number || null,
      expertise_area: app.expertise_area,
      experience_years: app.experience_years || 0,
      certificates: (Array.isArray(app.certificates) ? app.certificates : []).map((c) =>
        typeof c === "string" ? { url: c } : c
      ),
      description: app.description || "",
      review_status: "approved",
      is_public: !!activate_expert,
      review_notes: review_notes || "",
    };

    // 4️⃣ Tạo hoặc cập nhật record Expert
    const expert = await Expert.findOneAndUpdate(
      { user: app.user, is_deleted: false },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 5️⃣ Cập nhật role user → expert
    const updatedUser = await User.findByIdAndUpdate(
      app.user,
      { role: "expert" },
      { new: true }
    );

    // 6️⃣ Gửi email thông báo cho user
    if (updatedUser?.email) {
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
    }

    // 7️⃣ Xóa đơn sau khi duyệt
    await ExpertApplication.findByIdAndDelete(id);

    // 8️⃣ Trả phản hồi
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


// PATCH /api/expert-applications/:id/reject
export const reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const application = await ExpertApplication.findById(id);
    if (!application) return res.status(404).json({ error: "Không tìm thấy đơn" });

    const user = await User.findById(application.user);
    if (!user) return res.status(404).json({ error: "Không tìm thấy user" });

    await ExpertApplication.findByIdAndUpdate(id, { status: "rejected", reason });

    // 🔔 Gửi email cho user
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

    res.json({ message: "Đã từ chối đơn." });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
