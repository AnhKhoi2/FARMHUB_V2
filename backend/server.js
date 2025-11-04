import 'dotenv/config';
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import {connectDB} from "./config/db.js";
import authRoute from "./routes/auth.js";


const PORT = process.env.PORT || 5000;

const app = express();

connectDB()

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoute);

app.listen(PORT, () => {
  console.log(`Server is running on  ${PORT}`);
});