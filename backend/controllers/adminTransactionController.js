import Order from "../models/Order.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// List orders (admin) with filters and pagination
export const listTransactions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    paymentStatus,
    userId,
    itemType,
  } = req.query;

  const query = {};
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (userId) query.userId = userId;

  // If caller wants only subscription purchases, default to Subscription
  if (itemType) {
    query["items.itemType"] = itemType;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("userId", "username email")
      .select("-__v"),
    Order.countDocuments(query),
  ]);

  return res.json({
    success: true,
    orders,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Get single order by id
export const getTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id).populate("userId", "username email");

  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Không tìm thấy giao dịch" });

  return res.json({ success: true, order });
});
