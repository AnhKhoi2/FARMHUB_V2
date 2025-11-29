import express from "express";
import mongoose from "mongoose";
import PlantGroup from "../models/PlantGroup.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET /api/plant-groups
// Return an array of plant group documents if collection exists, otherwise
// return distinct plant_group values derived from guides collection.
router.get("/", async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // Try to read from a dedicated collection `plantgroups` (common name)
    const collNames = await db.listCollections().toArray();
    const names = collNames.map((c) => c.name.toLowerCase());

    if (names.includes("plantgroups")) {
      const docs = await db
        .collection("plantgroups")
        .find({}, { projection: { _id: 1, name: 1, slug: 1 } })
        .toArray();
      return res.json({ success: true, data: docs });
    }

    // Fallback: derive distinct plant_group from guides collection
    if (names.includes("guides")) {
      const vals = await db.collection("guides").distinct("plant_group");
      // return as objects for consistency with plantgroups collection
      const out = (vals || [])
        .filter(Boolean)
        .map((v) => ({ _id: v, name: v, slug: v }));
      return res.json({ success: true, data: out });
    }

    // Nothing found — return empty
    return res.json({ success: true, data: [] });
  } catch (err) {
    console.error("/api/plant-groups error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

  // Admin: create a plant group
  router.post("/", verifyToken, requireAdmin, async (req, res) => {
    try {
      const { name, slug, description, plants } = req.body;
      if (!name || !slug) return res.status(400).json({ success: false, message: "Missing name or slug" });
      const existing = await PlantGroup.findOne({ slug });
      if (existing) return res.status(409).json({ success: false, message: "Slug already exists" });
      const pg = await PlantGroup.create({ name, slug, description, plants: plants || [] });
      return res.json({ success: true, data: pg });
    } catch (err) {
      console.error("POST /api/plant-groups error", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Admin: update a plant group
  router.put("/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const pg = await PlantGroup.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
      if (!pg) return res.status(404).json({ success: false, message: "PlantGroup not found" });
      return res.json({ success: true, data: pg });
    } catch (err) {
      console.error("PUT /api/plant-groups/:id error", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Admin: delete a plant group
  router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const pg = await PlantGroup.findByIdAndDelete(id);
      if (!pg) return res.status(404).json({ success: false, message: "PlantGroup not found" });
      return res.json({ success: true, data: pg });
    } catch (err) {
      console.error("DELETE /api/plant-groups/:id error", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });

export default router;
