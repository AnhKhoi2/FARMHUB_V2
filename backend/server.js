import 'dotenv/config';
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import {connectDB} from "./config/db.js";
import authRoute from "./routes/auth.js";
import guidesRoute from "./routes/guides.js";
import plantModelsRouter from "./routes/plantModels.js";
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
app.use("/guides", guidesRoute);
app.use("/plant-models", plantModelsRouter);

// Serve uploaded files from /uploads (make sure you save images there)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`Server is running on  ${PORT}`);
});