import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";
import { BadRequest, Conflict, Forbidden, NotFound } from "../utils/ApiError.js";

const SAFE_SELECT = "-password -refreshTokens -resetPasswordToken -resetPasswordExpires";
const ALLOWED_ROLES = ["user", "expert", "moderator", "admin"];

export const userController = {
  // GET /admin/users
  list: asyncHandler(async (req, res) => {
    const {
      q,
      role,
      isDeleted, // optional explicit filter: "true" | "false"
      includeDeleted, // if true, don't force isDeleted=false
      page = 1,
      limit = 20,
      sort = "-updatedAt",
    } = req.query;

    const filter = {};

    // Deletion filter precedence: isDeleted param overrides includeDeleted
    if (typeof isDeleted !== "undefined") {
      filter.isDeleted = String(isDeleted) === "true";
    } else if (includeDeleted !== "true") {
      filter.isDeleted = false;
    }

    if (role) filter.role = role;

    if (q) {
      // Use text search if available, fallback to regex
      filter.$or = [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object from string like "-updatedAt" or "createdAt"
    const sortObj = {};
    if (sort) {
      const fields = String(sort).split(",");
      for (const f of fields) {
        if (!f) continue;
        if (f.startsWith("-")) sortObj[f.slice(1)] = -1;
        else sortObj[f] = 1;
      }
    } else {
      sortObj.updatedAt = -1;
    }

    const [items, total] = await Promise.all([
      User.find(filter).select(SAFE_SELECT).sort(sortObj).skip(skip).limit(limitNum),
      User.countDocuments(filter),
    ]);

    return ok(res, { items, total, page: pageNum, limit: limitNum });
  }),

  // GET /admin/users/:id
  detail: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).select(SAFE_SELECT);
    if (!user) throw NotFound("Không tìm thấy người dùng");
    return ok(res, user);
  }),

  // PATCH /admin/users/:id/role  { role }
  updateRole: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!role || !ALLOWED_ROLES.includes(role)) {
      throw BadRequest("Role không hợp lệ");
    }

    const target = await User.findById(id);
    if (!target) throw NotFound("Không tìm thấy người dùng");

    // If changing away from admin, ensure not demoting the last active admin
    const isDemotingAdmin = target.role === "admin" && role !== "admin";
    if (isDemotingAdmin) {
      const otherAdmins = await User.countDocuments({
        _id: { $ne: target._id },
        role: "admin",
        isDeleted: false,
      });
      if (otherAdmins === 0) {
        throw Conflict("Không thể hạ cấp Admin cuối cùng");
      }
    }

    target.role = role;
    await target.save();

    const safe = await User.findById(target._id).select(SAFE_SELECT);
    return ok(res, safe);
  }),

  // DELETE /admin/users/:id (soft delete)
  softDelete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user?.id;

    if (String(requesterId) === String(id)) {
      throw Forbidden("Bạn không thể tự xóa tài khoản của mình");
    }

    const user = await User.findById(id);
    if (!user) throw NotFound("Không tìm thấy người dùng");

    // Prevent deleting the last admin
    if (!user.isDeleted && user.role === "admin") {
      const otherAdmins = await User.countDocuments({
        _id: { $ne: user._id },
        role: "admin",
        isDeleted: false,
      });
      if (otherAdmins === 0) throw Conflict("Không thể xóa Admin cuối cùng");
    }

    if (user.isDeleted) {
      // idempotent
      return ok(res, await User.findById(id).select(SAFE_SELECT));
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    const safe = await User.findById(id).select(SAFE_SELECT);
    return ok(res, safe);
  }),

  // PATCH /admin/users/:id/restore
  restore: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) throw NotFound("Không tìm thấy người dùng");

    if (!user.isDeleted) {
      return ok(res, await User.findById(id).select(SAFE_SELECT));
    }

    user.isDeleted = false;
    user.deletedAt = undefined;
    await user.save();

    const safe = await User.findById(id).select(SAFE_SELECT);
    return ok(res, safe);
  }),
};
