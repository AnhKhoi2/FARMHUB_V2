import express from "express";
import { ok } from "../utils/ApiResponse.js";

const router = express.Router();

// Simple healthcheck/test route used by server during development
router.get("/ping", (req, res) => {
  ok(res, { msg: "pong" });
});

export default router;
