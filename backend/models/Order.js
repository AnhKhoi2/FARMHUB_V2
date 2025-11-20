import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // Thông tin đơn hàng
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderRef: {
      type: String,
      required: true,
    },

    // Thông tin sản phẩm/dịch vụ
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "items.itemType",
        },
        itemType: {
          type: String,
          enum: ["MarketListing", "Subscription", "Guide", "Other"],
        },
        name: String,
        quantity: {
          type: Number,
          default: 1,
        },
        price: Number,
      },
    ],

    // Tổng tiền
    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "VND",
    },

    // Mô tả đơn hàng
    orderDescription: String,

    // Trạng thái đơn hàng
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "completed",
        "cancelled",
        "failed",
      ],
      default: "pending",
    },

    // Thông tin thanh toán
    paymentMethod: {
      type: String,
      enum: ["vnpay", "momo", "cod", "bank_transfer"],
      default: "vnpay",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paidAt: Date,

    // Thông tin từ VNPay callback
    paymentInfo: {
      type: mongoose.Schema.Types.Mixed,
    },

    // Thông tin giao hàng (nếu cần)
    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      ward: String,
      district: String,
      province: String,
    },

    // Ghi chú
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index để tìm kiếm nhanh
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderRef: 1 });
orderSchema.index({ paymentStatus: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
