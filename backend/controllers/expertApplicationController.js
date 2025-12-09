// backend/src/controllers/expertApplicationController.js
import mongoose from "mongoose";
import Expert from "../models/Expert.js";
import User from "../models/User.js";
import ExpertApplication from "../models/ExpertApplication.js";
import { sendMail } from "../utils/mailer.js";

const ALLOWED_STATUS = ["pending", "approved", "rejected"];

// ===============================
// Admin list: GET /api/expert-applications?status=pending&q=&page=&limit=
// ===============================
export async function list(req, res) {
  try {
    const { status, q, page = 1, limit = 20 } = req.query || {};

    // --- Validate page & limit ---
    const pageNum = Number(page);
    const limitNum = Number(limit);

    if (!Number.isFinite(pageNum) || pageNum <= 0) {
      return res
        .status(400)
        .json({ error: "Tham số 'page' phải là số nguyên dương." });
    }
    if (!Number.isFinite(limitNum) || limitNum <= 0) {
      return res
        .status(400)
        .json({ error: "Tham số 'limit' phải là số nguyên dương." });
    }

    const safeLimit = Math.min(limitNum, 100); // tránh query quá nặng

    const filter = {};

    // --- Validate status filter ---
    if (status) {
      if (!ALLOWED_STATUS.includes(status)) {
        return res.status(400).json({
          error:
            "Giá trị 'status' không hợp lệ. Hợp lệ: " +
            ALLOWED_STATUS.join(", "),
        });
      }
      filter.status = status;
    }

    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), "i");
      filter.$or = [
        { full_name: rx },
        { expertise_area: rx },
        { description: rx },
      ];
    }

    const items = await ExpertApplication.find(filter)
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .skip((pageNum - 1) * safeLimit)
      .lean();

    const total = await ExpertApplication.countDocuments(filter);

    return res.status(200).json({
      data: {
        items,
        total,
        page: pageNum,
        limit: safeLimit,
      },
    });
  } catch (err) {
    console.error("List applications error:", err);
    return res
      .status(500)
      .json({ error: "Failed to get applications", detail: err.message });
  }
}

// ===============================
// Mine: GET /api/expert-applications/mine
// (FE gọi expertApplicationApi.getMine())
// ===============================
export async function getMine(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userIdStr = String(userId);
    if (!mongoose.Types.ObjectId.isValid(userIdStr)) {
      return res.status(400).json({ error: "User ID không hợp lệ." });
    }

    const apps = await ExpertApplication.find({ user: userIdStr })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ data: apps });
  } catch (err) {
    console.error("Get my applications error:", err);
    return res.status(500).json({
      error: "Failed to get your applications",
      detail: err.message,
    });
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

    const app = await ExpertApplication.findById(id);
    if (!app) {
      return res.status(404).json({ error: "Application not found" });
    }

    return res.status(200).json({ data: app });
  } catch (err) {
    console.error("Get application error:", err);
    return res.status(500).json({
      error: "Failed to get application detail",
      detail: err.message,
    });
  }
}

// ===============================
// Create (user submit):
// POST /api/expert-applications
// body: { full_name, expertise_area, experience_years, description,
//         phone_number, certificates[] }
// FE mong: thiếu field → 422 + { message, errors:{.} }
//         trùng pending → 409 + { message }
// ===============================
export async function create(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userIdStr = String(userId);
    if (!mongoose.Types.ObjectId.isValid(userIdStr)) {
      return res.status(400).json({ error: "User ID không hợp lệ." });
    }

    const user = await User.findById(userIdStr);
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy user" });
    }
    
    const {
      full_name,
      expertise_area,
      experience_years = 0,
      description = "",
      phone_number,
      certificates, // may be undefined / string / array
    } = req.body || {};
const expertiseStr = expertise_area ? String(expertise_area).trim() : "";
    const phoneStr = phone_number ? String(phone_number).trim() : "";
    // --- Normalize certificates so it always becomes an array of non-empty strings.
    // Accept uploaded file paths like "/uploads/..." and text links like "http://..."
    let rawCertificates = certificates;
    if (rawCertificates === null || rawCertificates === undefined || rawCertificates === "") {
      rawCertificates = [];
    } else if (!Array.isArray(rawCertificates)) {
      // client may send single string
      rawCertificates = [rawCertificates];
    }

    // Trim items and remove empties; accept any string (no URI validation)
    const certs = rawCertificates
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);

    // --- Validate other fields (keep minimal checks) ---
    const errors = {};

    if (!full_name || !String(full_name).trim()) {
      errors.full_name = "Họ tên là bắt buộc";
    } else if (String(full_name).trim().length > 50) {
      errors.full_name = "Họ tên tối đa 50 ký tự";
    }

      // LĨNH VỰC CHUYÊN MÔN (giới hạn 50 ký tự)
    if (!expertiseStr) {
      errors.expertise_area = "Lĩnh vực là bắt buộc";
    } else if (expertiseStr.length > 50) {
      errors.expertise_area = "Lĩnh vực tối đa 50 ký tự";
    }

    const expNum = Number(experience_years);
    if (Number.isNaN(expNum) || expNum <= 0) {
      errors.experience_years =
        "Số năm kinh nghiệm phải là số không âm (> 0).";
    }

   if (!phoneStr) {
      errors.phone_number = "Số điện thoại là bắt buộc.";
    } else {
      // 0 + 9 số  HOẶC  +84/84 + 9 số
      const vnPhoneRegex = /^(0\d{9}|(\+84|84)\d{9})$/;
      if (!vnPhoneRegex.test(phoneStr)) {
        errors.phone_number =
          "Số điện thoại không đúng định dạng Việt Nam (10 số, bắt đầu bằng 0 hoặc +84/84).";
      }
    }

    if (description && String(description).trim().length > 250) {
      errors.description = "Giới thiệu tối đa 250 ký tự";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        message: "Vui lòng kiểm tra các trường bắt buộc / định dạng dữ liệu.",
        errors,
      });
    }
    // =======================
// Kiểm tra trùng số điện thoại
// =======================
if (phone_number && String(phone_number).trim()) {
  const existPhone = await ExpertApplication.findOne({
    phone_number: phone_number.trim(),
    status: { $in: ["pending", "approved"] }, // approved rồi thì cũng không cho người khác dùng số này
  });

  if (existPhone) {
    return res.status(409).json({
      message: "Số điện thoại này đã được sử dụng cho một hồ sơ Expert khác.",
      field: "phone_number",
    });
  }
}

    // Kiểm tra pending theo field user
    const existing = await ExpertApplication.findOne({
      user: userIdStr,
      status: "pending",
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Bạn đã có đơn đang chờ duyệt." });
    }

    // Tạo mới
    const app = await ExpertApplication.create({
      user: userIdStr,
      email: user.email,
      full_name: String(full_name).trim(),
      expertise_area: String(expertise_area).trim(),
      experience_years: expNum,
      description,
      phone_number,
      certificates: certs,
      status: "pending",
    });

    // Gửi mail cho Admin (nếu cấu hình email)
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      if (adminEmail) {
        await sendMail({
          to: adminEmail,
          subject: "FarmHub - Đơn đăng ký Expert mới",
          html: `
            <p>Xin chào Admin,</p>
            <p>Người dùng <b>${user.fullName || user.username}</b> (${
            user.email
          }) đã nộp đơn đăng ký trở thành Expert.</p>
            <p>Vui lòng vào trang quản trị để duyệt đơn.</p>
            <p>— FarmHub System</p>
          `,
        });
      } else {
        console.warn(
          "ADMIN_EMAIL/EMAIL_USER chưa được cấu hình, bỏ qua gửi mail Admin."
        );
      }
    } catch (e) {
      console.warn("sendMail ADMIN failed:", e?.message);
    }

    return res
      .status(201)
      .json({ message: "Đã nộp đơn thành công", data: app });
  } catch (err) {
    console.error("Create expert application error:", err);
    return res.status(500).json({
      error: "Internal server error",
      detail: err.message,
    });
  }
}

// ===============================
// Approve: PATCH /api/expert-applications/:id/approve
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
    if (app.status !== "pending") {
      return res.status(400).json({ error: "Only pending applications can be approved" });
    }

    // ⭐ Payload chuyên gia mới
    const payload = {
      user: app.user,
      full_name: app.full_name,
      phone_number: app.phone_number,
      expertise_area: app.expertise_area,
      experience_years: app.experience_years || 0,
    
      certificates: Array.isArray(app.certificates)
        ? app.certificates.map(c => (typeof c === "string" ? { url: c } : c))
        : [],
    
      description: app.description || "",
      avatar: app.avatar || null,  // avatar từ đơn mới nhất
    
      // ⭐ BẮT BUỘC ĐỂ EXPERTLIST HIỂN THỊ
      review_status: "approved",
      is_public: true,   // thay vì !!activate_expert (Admin đâu bật tắt gì trong approve)
      is_deleted: false,
      is_active: true,
    
      // ⭐ RẤT QUAN TRỌNG (thiếu là ExpertList không nhận expert mới)
      created_at: new Date(),
      updated_at: new Date(),
    
      deleted_at: null
    };
    

    // ⭐ Tạo / cập nhật expert
    const expert = await Expert.findOneAndUpdate(
      { user: app.user },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ⭐ Cập nhật role user + avatar mới
    const updatedUser = await User.findByIdAndUpdate(
      app.user,
      { 
        role: "expert",
        avatar: expert?.avatar || null    // ⭐ RẤT QUAN TRỌNG
      },
      { new: true }
    );

    // Cập nhật đơn
    app.status = "approved";
    app.review_notes = review_notes;
    await app.save();

    res.status(200).json({
      message: "Application approved successfully",
      expert,
      user: updatedUser
    });

    if (updatedUser?.email) {
  sendMail({
    to: updatedUser.email,
    subject: "FarmHub - Expert Approved",
    html: `
      <p>Xin chúc mừng! Đơn đăng ký Expert của bạn trên hệ thống <strong>FarmHub</strong> đã được xét duyệt thành công.</p>
      <p>Bây giờ bạn đã có thể truy cập vào các chức năng dành riêng cho Expert, bao gồm quản lý hồ sơ chuyên môn, tư vấn người dùng và tham gia đóng góp nội dung chuyên sâu.</p>
      <p>Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ đội ngũ FarmHub để được hỗ trợ kịp thời.</p>
      <p>Trân trọng,<br/>FarmHub Team</p>
    `
  }).catch(() => {});
}


  } catch (err) {
    console.error("Approve application error:", err);
    res.status(500).json({ error: "Failed to approve", detail: err.message });
  }
}




// ===============================
// Reject: PATCH /api/expert-applications/:id/reject
// ===============================
export async function reject(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    // Lấy đơn nhẹ nhàng với lean()
    const application = await ExpertApplication.findById(id).lean();
    if (!application) {
      return res.status(404).json({ error: "Không tìm thấy đơn" });
    }

    if (application.status && application.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Chỉ có thể từ chối các đơn đang ở trạng thái pending." });
    }

    // Lấy user cũng lean để nhẹ
    const user = await User.findById(application.user).lean();
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy user" });
    }

    // Cập nhật trạng thái đơn → rejected
    await ExpertApplication.findByIdAndUpdate(id, {
      status: "rejected",
      reject_reason: reason || "",
    });

    // ✅ TRẢ RESPONSE CHO FE NGAY → không phải đợi gửi mail
    res.json({ message: "Đã từ chối đơn." });

    // 📧 GỬI MAIL SAU, FIRE-AND-FORGET (KHÔNG await)
    if (user.email) {
      sendMail({
        to: user.email,
        subject: "FarmHub - Đơn đăng ký Expert bị từ chối",
        html: `
          <p>Xin chào ${user.fullName || user.username || "bạn"},</p>
          <p>Rất tiếc, đơn đăng ký Expert của bạn đã bị từ chối.</p>
          ${
            reason
              ? `<p><b>Lý do:</b> ${reason}</p>`
              : ""
          }
          <p>Bạn có thể chỉnh sửa hồ sơ và nộp lại trong tương lai.</p>
          <p>— FarmHub Team</p>
        `,
      }).catch((e) => {
        console.warn("sendMail USER failed:", e?.message);
      });
    }
  } catch (err) {
    console.error("Reject error:", err);
    return res.status(500).json({
      error: "Internal server error",
      detail: err.message,
    });
  }
}

