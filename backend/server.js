// backend/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoute from "./routes/auth.js";
import profileRoute from "./routes/profile.js";
import diseaseRoutes from "./routes/diseases.js";
import diseaseCategoryRoutes from "./routes/diseaseCategories.js";
import publicDiseases from "./routes/publicDiseases.js";
import publicDiseaseCategories from "./routes/publicDiseaseCategories.js";
import streakRoutes from "./routes/streaks.js";
import aiRoutes from "./routes/ai.js";
import weatherRoutes from "./routes/weather.js";
import testRoute from "./routes/test.js";
import guidesRoute from "./routes/guides.js";
import notebooksRoute from "./routes/notebooks.js";
import usersRoute from "./routes/users.js";
// import expertApplicationRoutes from "./routes/expertApplicationRoutes.js";
import expertRoutes from "./routes/expert.routes.js";
import plantTemplateRoutes from "./routes/plantTemplates.js";
import uploadRoutes from "./routes/upload.js";
import plantGroupsRoute from "./routes/plantGroups.js";
import collectionsRoute from "./routes/collections.js";
import path from "path";
import { fileURLToPath } from "url";
import modelsRoutes from "./routes/models.js";
import layoutsRoutes from "./routes/layouts.js";
import postRoutes from "./routes/post.js";
import expertApplicationsRouter from "./routes/expertApplications.js";
import expertRatingRoutes from "./routes/expertRating.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import notificationRoutes from "./routes/notifications.js";
import vnpayRoutes from "./routes/vnpay.js";
import subscriptionRoutes from "./routes/subscription.js";
import { startStageMonitoringJob } from "./jobs/stageMonitoringJob.js";
import { startTaskReminderJob } from "./jobs/taskReminderJob.js";
import { startDailyTasksNotificationJob } from "./jobs/dailyTasksNotificationJob.js";
import { startObservationNotificationJob } from "./jobs/observationNotificationJob.js";
import pino from "pino-http";
import ApiError, { NotFound } from "./utils/ApiError.js";
import geocodeRoute from "./routes/geocode.js";
import weatherRoute from "./routes/weather_v2.js";
import airRoute from "./routes/air.js";

import tilesRoute from "./routes/tiles.js";
import plantRoute from "./routes/plant.js";
import plantAdviceRoutes from "./routes/plantAdviceRoutes.js";
import adminTransactionsRoute from "./routes/adminTransactions.js";

const PORT = process.env.PORT || 5000;

const app = express();

connectDB();

// Middleware
// Allow the frontend dev server (supports multiple dev ports and an env override)
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
// Include optional BASE_URL (if frontend served at same domain) in allowed origins
const baseUrl = (process.env.BASE_URL || process.env.VNP_BASE_URL || "").trim();
const allowedOrigins = [
  clientUrl,
  "http://localhost:5173",
  "http://localhost:5174",
];
if (baseUrl) allowedOrigins.push(baseUrl);
app.use(
  cors({
    origin: (origin, cb) => {
      // allow requests with no origin (like curl/postman)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS policy: This origin is not allowed"), false);
    },
    credentials: true,
  })
);

// 🔧 TĂNG LIMIT JSON – tránh 413 khi có body lớn (ngoài upload file)
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cookieParser());

// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", plantAdviceRoutes);
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/geocode", geocodeRoute);
app.use("/api/weather", weatherRoute);
app.use("/api/air", airRoute);
app.use("/api/plant", plantRoute);
app.use("/api/ow/tiles", tilesRoute);
app.use("/auth", authRoute);
app.use("/profile", profileRoute);
app.use("/admin/diseases", diseaseRoutes);
app.use("/admin/disease-categories", diseaseCategoryRoutes);
// Public (user-facing) endpoints without /admin prefix
app.use("/diseases", publicDiseases);
app.use("/disease-categories", publicDiseaseCategories);
app.use("/admin/streaks", streakRoutes);
app.use("/ai", aiRoutes);
app.use("/admin/weather", weatherRoutes);
app.use("/test", testRoute);
app.use("/guides", guidesRoute);
app.use("/notebooks", notebooksRoute);
// Backwards-compatible alias: some frontends call /api/notebooks
app.use("/api/notebooks", notebooksRoute);
app.use("/admin/users", usersRoute);
// app.use("/api/expert-applications", expertApplicationRoutes);

app.use("/api/expert-applications", expertApplicationsRouter);
app.use("/api/experts", expertRatingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/experts", expertRoutes);
app.use("/api/plant-templates", plantTemplateRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/plant-groups", plantGroupsRoute);
// Legacy/compatibility: some frontends post to /upload (no /api prefix)
app.use("/upload", uploadRoutes);
app.use("/api/collections", collectionsRoute);
app.use("/admin/models", modelsRoutes);
app.use("/layouts", layoutsRoutes);
// new primary path
app.use("/admin/managerpost", postRoutes);
app.use("/api/posts", postRoutes);
app.use("/admin/transactions", adminTransactionsRoute);

// (legacy alias removed) '/admin/managerpost' is the canonical path for post management
app.use("/api/notifications", notificationRoutes);
app.use("/api/vnpay", vnpayRoutes);
app.use("/api/subscription", subscriptionRoutes);

// Serve uploaded files from /uploads (make sure you save images there)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔄 Khởi chạy cron jobs
startStageMonitoringJob(); // Chạy hàng ngày lúc 08:00 VN (01:00 UTC) - kiểm tra stage status
startTaskReminderJob(); // Chạy hàng ngày lúc 07:00 UTC - nhắc nhở tasks chưa hoàn thành
startDailyTasksNotificationJob(); // Chạy hàng ngày lúc 07:00 UTC - thông báo tasks đã được sinh
startObservationNotificationJob(); // Chạy hàng ngày lúc 07:00 UTC - thông báo yêu cầu quan sát

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

// 404 cho route không tồn tại (optional)
app.use((req, res, next) => {
  // Log missing route for easier debugging, then return NotFound error
  console.warn(`⚠️ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  // Route not found -> use NotFound helper to create ApiError (status 404)
  next(NotFound(`Route không tồn tại: ${req.originalUrl}`));
});

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err);

  // Multer errors (file upload)
  if (err && err.name === "MulterError") {
    // Common Multer codes: LIMIT_FILE_SIZE, LIMIT_UNEXPECTED_FILE, etc.
    const multerMessage = err.message || "Lỗi trong quá trình upload file";
    const multerCode = err.code || "MULTER_ERROR";
    return res
      .status(400)
      .json({ success: false, code: multerCode, message: multerMessage });
  }

  // If it's our ApiError instance (created by helpers like BadRequest/NotFound)
  if (err instanceof ApiError || err?.isOperational) {
    const statusCode = err.statusCode || 400;
    const code = err.code || "ERROR";
    const message = err.message || "Có lỗi xảy ra";
    return res.status(statusCode).json({ success: false, code, message });
  }

  // Fallback: unexpected error -> 500
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({ success: false, code, message });
});
