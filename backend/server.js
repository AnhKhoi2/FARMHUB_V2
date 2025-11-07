import 'dotenv/config';
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import {connectDB} from "./config/db.js";
import authRoute from "./routes/auth.js";
import diseaseRoutes from "./routes/diseases.js";
import diseaseCategoryRoutes from "./routes/diseaseCategories.js";
import streakRoutes from "./routes/streaks.js";
import aiRoutes from "./routes/ai.js";
import weatherRoutes from "./routes/weather.js";
import testRoute from "./routes/test.js";
import guidesRoute from "./routes/guides.js";
import notebooksRoute from "./routes/notebooks.js";
import usersRoute from "./routes/users.js";
import expertApplicationRoutes from "./routes/expertApplicationRoutes.js";
import expertRoutes from "./routes/expert.routes.js";
import path from "path";
import { fileURLToPath } from 'url';


const PORT = process.env.PORT || 5000;

const app = express();

connectDB()

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoute);
app.use("/admin/diseases", diseaseRoutes);
app.use("/admin/disease-categories", diseaseCategoryRoutes);
app.use("/admin/streaks", streakRoutes);
app.use("/ai", aiRoutes);
app.use("/admin/weather", weatherRoutes);
app.use("/test", testRoute);
app.use("/guides", guidesRoute);
app.use("/notebooks", notebooksRoute);
app.use("/admin/users", usersRoute);
app.use("/api/expert-applications", expertApplicationRoutes);
app.use("/api/experts", expertRoutes);

// Serve uploaded files from /uploads (make sure you save images there)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

