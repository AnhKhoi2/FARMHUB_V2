import MarketPost from "../models/Post.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, noContent } from "../utils/ApiResponse.js";
import { AppError } from "../utils/AppError.js";

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

    const [items, total] = await Promise.all([
      MarketPost.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate({ path: 'userId', select: 'username email' }),
      MarketPost.countDocuments(filter),
    ]);

    return ok(res, { items, meta: { total, page: Number(page), limit: Number(limit) } });
  }),

  // Public listing (no auth) for browsing marketplace
  listPublic: asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { isDeleted: false };
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      MarketPost.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate({ path: 'userId', select: 'username' }),
      MarketPost.countDocuments(filter),
    ]);

    return ok(res, { items, meta: { total, page: Number(page), limit: Number(limit) } });
  }),

  trash: asyncHandler(async (req, res) => {
    const items = await MarketPost.find({ isDeleted: true }).sort({ updatedAt: -1 }).populate({ path: 'userId', select: 'username email' });
    return ok(res, items);
  }),

  // List reported posts (admin)
  reported: asyncHandler(async (req, res) => {
    // return posts that have at least one report
    const posts = await MarketPost.find({ 'reports.0': { $exists: true } }).sort({ updatedAt: -1 }).populate({ path: 'userId', select: 'username email' });
    return ok(res, posts);
  }),

  // View reports for a single post (admin)
  reportsForPost: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await MarketPost.findById(id).populate({ path: 'reports.userId', select: 'username email' }).populate({ path: 'userId', select: 'username email' });
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    return ok(res, { postId: post._id, reports: post.reports || [], postOwner: post.userId });
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
    const item = await MarketPost.findById(id).populate({ path: 'userId', select: 'username email' });
    if (!item) throw new AppError('Post not found', 404, 'NOT_FOUND');
    return ok(res, item);
  }),

  create: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { title, description, phone, location = {}, images = [] } = req.body;
    if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    if (!title) throw new AppError('Title is required', 400, 'MISSING_TITLE');

    const post = await MarketPost.create({ userId, title, description, phone, location, images });
    return ok(res, post);
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
