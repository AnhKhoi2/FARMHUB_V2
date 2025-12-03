import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// GET /api/plants?limit=1000
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "1000", 10);
    const db = mongoose.connection.db;
    if (!db)
      return res.status(500).json({ success: false, message: "DB not ready" });

    // Use aggregation to lookup plant_group slug from plantgroups collection
    const pipeline = [
      { $sort: { name: 1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "plantgroups",
          localField: "plant_group",
          foreignField: "_id",
          as: "plant_group_doc",
        },
      },
      {
        $addFields: {
          plant_group_slug: {
            $cond: [
              { $gt: [{ $size: "$plant_group_doc" }, 0] },
              { $arrayElemAt: ["$plant_group_doc.slug", 0] },
              null,
            ],
          },
        },
      },
      {
        $project: {
          plant_group_doc: 0,
        },
      },
    ];

    const docs = await db.collection("plants").aggregate(pipeline).toArray();

    return res.json({ success: true, data: docs });
  } catch (err) {
    console.error("GET /api/plants error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
