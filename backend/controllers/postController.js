import MarketPost from "../models/Post.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, noContent } from "../utils/ApiResponse.js";
import { AppError } from "../utils/AppError.js";

// Helper: ensure images are usable by frontend
const BASE_URL = (process.env.BASE_URL || process.env.VNP_BASE_URL || '').replace(/\/$/, '');
const normalizeImageSrc = (img) => {
  try {
    if (!img) return img;
    if (typeof img !== 'string') return img;
    let s = img.trim();
    if (!s) return s;
    // normalize backslashes to forward slashes (some records have Windows style paths)
    s = s.replace(/\\/g, '/');
    // Already a full URL or data URI
    if (s.startsWith('http') || s.startsWith('data:')) return s;
    // If it's an absolute path (starts with '/'), prefix BASE_URL when available
    if (s.startsWith('/')) {
      return BASE_URL ? `${BASE_URL}${s}` : s;
    }
    // Otherwise assume it's a filename stored under /uploads
    const path = `/${s.startsWith('uploads') ? s : `uploads/${s}`}`;
    return BASE_URL ? `${BASE_URL}${path}` : path;
  } catch (e) {
    return img;
  }
};

export const postController = {
  list: asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { isDeleted: false };
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ];
    }

    const [rawItems, total] = await Promise.all([
      MarketPost.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate({ path: 'userId', select: 'username email phone' }),
      MarketPost.countDocuments(filter),
    ]);

    const items = rawItems.map((it) => {
      const obj = it.toObject ? it.toObject() : it;
      obj.posterPhone = obj.phone || (obj.userId && obj.userId.phone) || null;
      if (obj.userId) obj.userId.phone = obj.userId.phone || obj.posterPhone;
      // Normalize image paths so frontend always receives a usable src string
      if (obj.images && Array.isArray(obj.images)) {
        obj.images = obj.images.map((img) => normalizeImageSrc(img));
      }
      return obj;
    });

    return ok(res, { items, meta: { total, page: Number(page), limit: Number(limit) } });
  }),

  // Public listing (no auth) for browsing marketplace
  listPublic: asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, q, category } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { isDeleted: false };
    if (category) {
      // Allow frontend to request posts filtered by category (exact match)
      filter.category = category;
    }
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    // Prioritize 'Trao đổi' and 'Cho tặng' posts first, then sort by createdAt desc.
    const match = filter;
    const aggPipeline = [
      { $match: match },
      { $addFields: { __priority: { $cond: [{ $in: ["$category", ["Trao đổi", "Cho tặng"]] }, 0, 1] } } },
      { $sort: { __priority: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $addFields: { userId: { _id: '$user._id', username: '$user.username', email: '$user.email', phone: '$phone' }, posterPhone: { $ifNull: ['$phone', '$user.phone'] } } },
      { $project: { user: 0, __priority: 0 } },
    ];

    const [rawItemsAgg, total] = await Promise.all([
      MarketPost.aggregate(aggPipeline),
      MarketPost.countDocuments(filter),
    ]);

    // normalize images for aggregated results
    const items = (rawItemsAgg || []).map((obj) => {
      if (obj.images && Array.isArray(obj.images)) obj.images = obj.images.map((i) => normalizeImageSrc(i));
      return obj;
    });

    return ok(res, { items, meta: { total, page: Number(page), limit: Number(limit) } });
  }),

  trash: asyncHandler(async (req, res) => {
    const rawItems = await MarketPost.find({ isDeleted: true }).sort({ updatedAt: -1 }).populate({ path: 'userId', select: 'username email phone' });
    const items = rawItems.map((it) => {
      const obj = it.toObject ? it.toObject() : it;
      obj.posterPhone = obj.phone || (obj.userId && obj.userId.phone) || null;
      if (obj.userId) obj.userId.phone = obj.userId.phone || obj.posterPhone;
      if (obj.images && Array.isArray(obj.images)) obj.images = obj.images.map((i) => normalizeImageSrc(i));
      return obj;
    });
    return ok(res, items);
  }),

  // List reported posts (admin)
  reported: asyncHandler(async (req, res) => {
    // return posts that have at least one report
    const rawPosts = await MarketPost.find({ 'reports.0': { $exists: true } }).sort({ updatedAt: -1 }).populate({ path: 'reports.userId', select: 'username email phone' }).populate({ path: 'userId', select: 'username email phone' });
    const posts = rawPosts.map((it) => {
      const obj = it.toObject ? it.toObject() : it;
      obj.posterPhone = obj.phone || (obj.userId && obj.userId.phone) || null;
      if (obj.userId) obj.userId.phone = obj.userId.phone || obj.posterPhone;
      if (obj.images && Array.isArray(obj.images)) obj.images = obj.images.map((i) => normalizeImageSrc(i));
      return obj;
    });
    return ok(res, posts);
  }),

  // View reports for a single post (admin)
  reportsForPost: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await MarketPost.findById(id).populate({ path: 'reports.userId', select: 'username email phone' }).populate({ path: 'userId', select: 'username email phone' });
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    const obj = post.toObject ? post.toObject() : post;
    obj.posterPhone = obj.phone || (obj.userId && obj.userId.phone) || null;
    if (obj.userId) obj.userId.phone = obj.userId.phone || obj.posterPhone;
    if (obj.images && Array.isArray(obj.images)) obj.images = obj.images.map((i) => normalizeImageSrc(i));
    return ok(res, { postId: obj._id, reports: obj.reports || [], postOwner: obj.userId, post: obj });
  }),

  // Add a report to a post (authenticated users)
  report: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reporterId = req.user?.id;
    const { reason = '', message = '' } = req.body;
    if (!reporterId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const post = await MarketPost.findById(id);
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    post.reports.push({ userId: reporterId, reason, message, createdAt: new Date() });
    await post.save();
    return ok(res, { message: 'Reported' });
  }),

  // Ban the user who posted (admin). Also mark their posts as isDeleted and optionally add an audit note.
  banUserForPost: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await MarketPost.findById(id).populate({ path: 'userId' });
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    const user = await User.findById(post.userId._id);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    user.isBanned = true;
    await user.save();
    // soft-delete all posts by this user
    await MarketPost.updateMany({ userId: user._id }, { isDeleted: true });
    return ok(res, { message: 'User banned and posts hidden', userId: user._id });
  }),

  detail: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await MarketPost.findById(id).populate({ path: 'userId', select: 'username email phone' });
    if (!item) throw new AppError('Post not found', 404, 'NOT_FOUND');
    const obj = item.toObject ? item.toObject() : item;
    obj.posterPhone = obj.phone || (obj.userId && obj.userId.phone) || null;
    if (obj.userId) obj.userId.phone = obj.userId.phone || obj.posterPhone;
    if (obj.images && Array.isArray(obj.images)) obj.images = obj.images.map((i) => normalizeImageSrc(i));
    return ok(res, obj);
  }),

  // Public detail view (no auth) used by marketplace front-end
  detailPublic: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await MarketPost.findById(id).populate({ path: 'userId', select: 'username' });
    if (!item) throw new AppError('Post not found', 404, 'NOT_FOUND');
    // Attach posterPhone so front-end can display the full phone number stored on the post
    const obj = item.toObject ? item.toObject() : item;
    obj.posterPhone = obj.phone || (obj.userId && obj.userId.phone) || null;
    // also ensure userId.phone is set to the post phone if user record doesn't have phone
    if (obj.userId) obj.userId.phone = obj.userId.phone || obj.posterPhone;
    if (obj.images && Array.isArray(obj.images)) obj.images = obj.images.map((i) => normalizeImageSrc(i));
    return ok(res, obj);
  }),

  create: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const {
      title,
      description,
      phone,
      location = {},
      images = [],
      category,
      price,
    } = req.body;
  
    if (!userId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    if (!title) throw new AppError("Title is required", 400, "MISSING_TITLE");
  
    const post = await MarketPost.create({
      userId,
      title,
      description,
      phone,
      location,
      images,
      category: category || "Khác",
      price: price || "",
    });

    const obj = post.toObject ? post.toObject() : post;
    if (obj.images && Array.isArray(obj.images)) obj.images = obj.images.map((i) => normalizeImageSrc(i));
    return ok(res, obj);
  }),
  
  
  

  softDelete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await MarketPost.findById(id);
    if (!item) throw new AppError('Post not found', 404, 'NOT_FOUND');
    item.isDeleted = true;
    await item.save();
    return ok(res, { message: 'Moved to trash' });
  }),

  restore: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await MarketPost.findById(id);
    if (!item) throw new AppError('Post not found', 404, 'NOT_FOUND');
    item.isDeleted = false;
    await item.save();
    return ok(res, { message: 'Restored' });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) throw new AppError('Invalid status', 400, 'INVALID_STATUS');
    const item = await MarketPost.findByIdAndUpdate(id, { status }, { new: true });
    if (!item) throw new AppError('Post not found', 404, 'NOT_FOUND');
    return ok(res, item);
  }),
};
