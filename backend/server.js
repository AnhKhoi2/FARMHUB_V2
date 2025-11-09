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
import collectionsRoute from "./routes/collections.js";
import path from "path";
import { fileURLToPath } from "url";
import modelsRoutes from "./routes/models.js";
import layoutsRoutes from "./routes/layouts.js";
import postRoutes from "./routes/post.js";
import expertApplicationsRouter from "./routes/expertApplications.js";

const PORT = process.env.PORT || 5000;

const app = express();

connectDB();

// Middleware
// Allow the frontend dev server (supports multiple dev ports and an env override)
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = [clientUrl, "http://localhost:5173", "http://localhost:5174"];
app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (like curl/postman)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("CORS policy: This origin is not allowed"), false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoute);
app.use("/profile", profileRoute);
app.use("/admin/diseases", diseaseRoutes);
app.use("/admin/disease-categories", diseaseCategoryRoutes);
app.use("/admin/streaks", streakRoutes);
app.use("/ai", aiRoutes);
app.use("/admin/weather", weatherRoutes);
app.use("/test", testRoute);
app.use("/guides", guidesRoute);
app.use("/notebooks", notebooksRoute);
app.use("/admin/users", usersRoute);
// app.use("/api/expert-applications", expertApplicationRoutes);

app.use("/api/expert-applications", expertApplicationsRouter);

app.use("/api/experts", expertRoutes);
app.use("/api/plant-templates", plantTemplateRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/collections", collectionsRoute);
app.use("/admin/models", modelsRoutes);
app.use("/layouts", layoutsRoutes);
// new primary path
app.use("/admin/managerpost", postRoutes);
// (legacy alias removed) '/admin/managerpost' is the canonical path for post management

// Serve uploaded files from /uploads (make sure you save images there)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
