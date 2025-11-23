import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectDB } from "../config/db.js";
import Guide from "../models/Guide.js";

/**
 * Classify guides by plant_name -> plant_group mapping and add standardized tags
 * Usage: node backend/scripts/classifyGuidesByPlantType.js
 */

const mapping = {
  // fruit short term
  "Dưa leo": "fruit_short_term",
  "Cà chua bi": "fruit_short_term",
  "Dâu tây": "other", // also in 'other' group previously; keep as other or fruit_short_term as desired
  "Ớt chuông": "fruit_short_term",
  "Mướp": "fruit_short_term",

  // leaf vegetables
  "Xà lách": "leaf_vegetable",
  "Rau muống": "leaf_vegetable",
  "Cải xanh": "leaf_vegetable",
  "Rau thơm hỗn hợp": "leaf_vegetable",
  "Rau mầm": "leaf_vegetable",

  // root vegetables
  "Cà rốt baby": "root_vegetable",
  "Củ cải trắng": "root_vegetable",
  "Củ hành nhỏ": "root_vegetable",
  "Củ cải đỏ": "root_vegetable",
  "Khoai tây mini": "root_vegetable",

  // herbs
  "Húng quế": "herb",
  "Hành lá": "herb",
  "Ngò rí": "herb",
  "Sả": "herb",
  "Hương thảo": "herb",

  // other / fruit long term
  "Ổi lùn": "other",
  "Chanh dây nhỏ": "other",
  "Lê cảnh nhỏ": "other",
  "Cây hoa ăn được": "other",
};

const groupLabels = {
  leaf_vegetable: "Rau ăn lá",
  root_vegetable: "Rau củ",
  fruit_short_term: "Cây ăn quả ngắn hạn",
  fruit_long_term: "Cây ăn quả dài hạn",
  bean_family: "Họ đậu",
  herb: "Thảo mộc/Gia vị",
  flower_vegetable: "Cây hoa/rau hoa",
  other: "Khác",
};

function ensureArrayInclude(arr, item) {
  if (!Array.isArray(arr)) return [item];
  if (!arr.includes(item)) arr.push(item);
  return arr;
}

async function run() {
  await connectDB();
  console.log("✅ Connected to MongoDB");

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(process.cwd(), "scripts", `backup_guides_before_classify_${ts}.json`);
  const allGuides = await Guide.find({ deleted: false }).lean();
  fs.writeFileSync(backupPath, JSON.stringify(allGuides, null, 2), "utf-8");
  console.log(`🗄️  Backup saved to ${backupPath} (total ${allGuides.length} guides)`);

  let updated = 0;
  for (const g of allGuides) {
    const name = (g.plant_name || g.title || "").trim();
    let targetGroup = mapping[name];
    if (!targetGroup) {
      // fallback: try to infer from existing plant_group or tags
      targetGroup = g.plant_group || "other";
    }

    const label = groupLabels[targetGroup] || groupLabels.other;

    const newTags = Array.isArray(g.tags) ? [...g.tags] : [];
    const newPlantTags = Array.isArray(g.plantTags) ? [...g.plantTags] : [];
    if (!newPlantTags.includes(label)) newPlantTags.push(label);

    // Decide single 'category' value used by frontend ManagerGuides (`availablePlantTags`)
    function decideCategory(g, targetGroup, plantTags, tags) {
      const p = (plantTags || []).map(t => String(t).toLowerCase());
      const tgs = (tags || []).map(t => String(t).toLowerCase());

      if (tgs.some(x => x.includes('trong chung cư') || x.includes('ban công') || x.includes('chung cư'))) return 'Trồng trong chung cư';
      if (p.some(x => x.includes('trồng trong chung cư') || x.includes('ban công') || x.includes('chung cư'))) return 'Trồng trong chung cư';
      if (targetGroup === 'herb' || p.some(x => x.includes('thảo mộc') || x.includes('gia vị') || tgs.some(x => x.includes('gia vị')))) return 'Cây gia vị';
      if (targetGroup === 'root_vegetable' || p.some(x => x.includes('rau củ') || x.includes('rau củ dễ chăm'))) return 'Rau củ dễ chăm';
      if (targetGroup === 'fruit_short_term' || p.some(x => x.includes('trái cây ngắn hạn') || tgs.some(x => x.includes('ngắn hạn')))) return 'Trái cây ngắn hạn';
      if (tgs.some(x => x.includes('ít thời gian') || x.includes('ít thời gian chăm') || x.includes('ít công chăm'))) return 'Ít thời gian chăm sóc';
      if (tgs.some(x => x.includes('leo') || x.includes('giàn') || p.some(x => x.includes('leo')))) return 'Cây leo nhỏ';
      return '';
    }

    const categoryValue = decideCategory(g, targetGroup, newPlantTags, newTags);

    // Normalize Loai tags: prefer the frontend filter label (categoryValue) if available,
    // otherwise keep the group label. Remove old Loai:* entries and add the chosen one.
    const finalLoai = categoryValue || label || '';
    // remove existing Loai:... tags
    const cleanedTags = newTags.filter(t => !(typeof t === 'string' && t.startsWith('Loại:')));
    if (finalLoai) cleanedTags.push(`Loại:${finalLoai}`);

    const newTagsWithCategory = cleanedTags;
    // ensure plantTags includes the final label for frontend filtering
    if (finalLoai && !newPlantTags.includes(finalLoai)) newPlantTags.push(finalLoai);

    // Update only if changes needed
    const needUpdate = (g.plant_group !== targetGroup) || (JSON.stringify(g.tags) !== JSON.stringify(newTagsWithCategory)) || (JSON.stringify(g.plantTags) !== JSON.stringify(newPlantTags)) || (g.category !== categoryValue);
    if (needUpdate) {
      await Guide.updateOne({ _id: g._id }, {
        $set: {
          plant_group: targetGroup,
          tags: newTagsWithCategory,
          plantTags: newPlantTags,
          category: categoryValue
        }
      });
      updated++;
    }
  }

  console.log(`✅ Done. Updated ${updated} guides.`);
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
