import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";

// Load .env from backend
dotenv.config({ path: path.join(process.cwd(), ".env") });

const run = async () => {
  const mongoUri =
    process.env.MONGODB_CONNECTIONSTRING || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("No MongoDB URI found in env");
    process.exit(1);
  }
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const notebookId = process.argv[2];
  const userId = process.argv[3];

  const filter = {};
  if (notebookId) filter.notebook_id = notebookId;
  if (userId) filter.user_id = userId;

  const notifs = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  console.log(`Found ${notifs.length} notifications for filter:`, filter);
  notifs.forEach((n, i) => {
    console.log(
      `${i + 1}. id=${n._id} type=${n.type} title=${n.title} is_read=${
        n.is_read
      } createdAt=${n.createdAt} notebook=${n.notebook_id}`
    );
  });

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
