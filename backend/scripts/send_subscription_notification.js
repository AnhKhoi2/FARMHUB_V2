import "dotenv/config";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { sendSubscriptionUpgradeNotification } from "../controllers/notificationController.js";

async function main() {
  try {
    const uri = process.env.MONGODB_CONNECTIONSTRING;
    if (!uri) throw new Error("MONGODB_CONNECTIONSTRING not set in .env");
    await mongoose.connect(uri);
    console.log("MongoDB connected");

    // Configure these values if you want a different order/user
    const orderRef = process.argv[2] || "ORD20251129170344";

    const order = await Order.findOne({ orderRef });
    if (!order) {
      console.error("Order not found:", orderRef);
      process.exit(1);
    }

    // Find user to ensure exists
    const user = await User.findById(order.userId);
    if (!user) {
      console.error("User not found for order:", order.userId);
      process.exit(1);
    }

    // Compute plan mapping similar to vnpay.js
    const subscriptionItem = order.items.find(
      (i) => i.itemType === "Subscription"
    );
    const planName = subscriptionItem ? subscriptionItem.name : "Unknown Plan";
    const planMapping = {
      "Gói Thông Minh": "smart",
      "Gói VIP": "vip",
      "Gói Pro": "pro",
    };
    const plan = subscriptionItem
      ? planMapping[subscriptionItem.name] || "smart"
      : "smart";

    const expires = order.paidAt ? new Date(order.paidAt) : new Date();
    expires.setMonth(expires.getMonth() + 1);

    const notif = await sendSubscriptionUpgradeNotification({
      userId: user._id,
      plan,
      planName,
      expires,
      orderRef: order.orderRef,
      amount: order.totalAmount,
    });

    console.log("Notification created:", notif._id.toString());
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
