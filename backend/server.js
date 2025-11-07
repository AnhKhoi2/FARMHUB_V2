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
import path from "path";
import { fileURLToPath } from 'url';
import expertRoutes from "./routes/expert.routes.js";
import http from "http";  
import chatRoutes from "./routes/chat.routes.js";     // ✅ thêm
import { initSockets } from "./sockets/index.js"; 
import expertApplicationRoutes from "./routes/expertApplicationRoutes.js";

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
app.use("/api/experts", expertRoutes);
app.use("/api/chats", chatRoutes); 
     
// Serve uploaded files from /uploads (make sure you save images there)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/expert-applications", expertApplicationRoutes);
// ✅ Tạo HTTP server và khởi tạo Socket.IO
const server = http.createServer(app);
initSockets(server);

server.listen(PORT, () => {
  console.log(`🚀 Server & Socket.IO running on port ${PORT}`);
});
