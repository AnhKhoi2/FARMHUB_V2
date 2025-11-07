import express from "express";

const router = express.Router();

// Simple healthcheck/test route used by server during development
router.get("/ping", (req, res) => {
  res.json({ ok: true, msg: "pong" });
});

export default router;
