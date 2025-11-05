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

app.listen(PORT, () => {
  console.log(`Server is running on  ${PORT}`);
});