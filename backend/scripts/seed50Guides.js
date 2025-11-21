import "dotenv/config";
import { connectDB } from "../config/db.js";
import Guide from "../models/Guide.js";
import User from "../models/User.js";

/**
 * Script tạo 50 guide mẫu và gắn tag theo nhóm cây.
 * Chạy: node backend/scripts/seed50Guides.js
 */

const categories = [
  {
    plant_group: "fruit_short_term",
    label: "Cây ăn quả ngắn hạn",
    plantTags: ["Cây ăn quả ngắn hạn", "Ban công", "Sân thượng", "Chậu"],
  },
  {
    plant_group: "leaf_vegetable",
    label: "Rau ăn lá ngắn hạn",
    plantTags: ["Rau củ ngắn hạn", "Ban công", "Chậu", "Thu hoạch nhanh"],
  },
  {
    plant_group: "root_vegetable",
    label: "Rau củ (cây củ) ngắn hạn",
    plantTags: ["Rau củ ngắn hạn", "Chậu sâu", "Ban công"],
  },
  {
    plant_group: "herb",
    label: "Gia vị/Thảo mộc",
    plantTags: ["Gia vị", "Ban công", "Sân thượng", "Tái sinh"],
  },
  {
    plant_group: "other",
    label: "Cây phù hợp sân thượng/ban công",
    plantTags: ["Sân thượng", "Ban công", "Chậu", "Cảnh quan"],
  },
];

function makeSteps(i) {
  return [
    { title: "Chuẩn bị", text: `Chuẩn bị chậu, giá thể và hạt giống (mẫu ${i}).` },
    { title: "Gieo/Trồng", text: `Hướng dẫn gieo/trồng cơ bản cho mẫu ${i}.` },
    { title: "Chăm sóc", text: `Tưới, bón và thu hoạch — lưu ý dành cho mẫu ${i}.` },
  ];
}

async function run() {
  await connectDB();
  console.log("✅ Connected to MongoDB");

  // Lấy tất cả user có role = expert. Nếu không có, fallback sang admin.
  let expertUsers = await User.find({ role: "expert" }).lean();
  if (!expertUsers || expertUsers.length === 0) {
    const admin = await User.findOne({ role: "admin" }).lean();
    if (admin) expertUsers = [admin];
  }

  if (!expertUsers || expertUsers.length === 0) {
    console.error("❌ No expert/admin user found. Please create one before running this script.");
    process.exit(1);
  }

  console.log(`📝 Using ${expertUsers.length} author(s). First: ${expertUsers[0].username} (${expertUsers[0].role})`);

  const total = 50;
  const created = [];

  // Phân phối expert_id theo vòng (round-robin) nếu có nhiều expert
  for (let i = 1; i <= total; i++) {
    const cat = categories[(i - 1) % categories.length];
    const title = `Hướng dẫn ${cat.label} - mẫu ${i}`;
    const plant_name = `${cat.label} ${i}`;
    const description = `${cat.label} phù hợp trồng tại ban công, sân thượng và chậu. Hướng dẫn mẫu ${i}.`;
    const content = `<p>${cat.label} - mô tả tổng quan cho mẫu ${i}.</p>`;

    try {
      const assignedExpert = expertUsers[(i - 1) % expertUsers.length];
      const g = await Guide.create({
        expert_id: assignedExpert._id,
        title,
        plant_name,
        plant_group: cat.plant_group,
        description,
        content,
        image: "guides/placeholder.png",
        steps: makeSteps(i),
        plantTags: cat.plantTags,
        tags: [cat.label, "Ban công", "Sân thượng"],
        status: "published",
      });
      created.push(g);
      if (i % 10 === 0) console.log(`Created ${i}/${total} guides...`);
    } catch (err) {
      console.error(`❌ Failed to create guide ${i}:`, err.message);
    }
  }

  console.log(`\n✅ Done. Created ${created.length} guides.`);
  const countByGroup = await Guide.aggregate([
    { $match: { deleted: false } },
    { $group: { _id: "$plant_group", count: { $sum: 1 } } },
  ]);
  console.table(countByGroup);

  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
