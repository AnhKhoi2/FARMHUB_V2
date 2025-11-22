import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectDB } from "../config/db.js";
import Guide from "../models/Guide.js";

/**
 * Ensure each guide has a `category` matching the frontend filters and a `Loại:<category>` tag
 * Frontend categories:
 *  - "Rau củ dễ chăm"
 *  - "Trái cây ngắn hạn"
 *  - "Cây gia vị"
 *  - "Trồng trong chung cư"
 *  - "Ít thời gian chăm sóc"
 *  - "Cây leo nhỏ"
 *
 * Usage: node backend/scripts/ensureFrontendCategoryTags.js
 */

const FRONTEND_LABELS = [
  "Rau củ dễ chăm",
  "Trái cây ngắn hạn",
  "Cây gia vị",
  "Trồng trong chung cư",
  "Ít thời gian chăm sóc",
  "Cây leo nhỏ",
];

function inferCategory(g) {
  const plantGroup = g.plant_group || "";
  const tags = (g.tags || []).map(t => String(t).toLowerCase());
  const pTags = (g.plantTags || []).map(t => String(t).toLowerCase());

  // Apartment / balcony cues
  if (tags.some(t => t.includes('ban công') || t.includes('chung cư') || pTags.includes('ban công') || pTags.includes('chung cư'))) return 'Trồng trong chung cư';

  // Herbs
  if (plantGroup === 'herb' || pTags.some(t => t.includes('gia vị') || t.includes('thảo mộc'))) return 'Cây gia vị';

  // Root / easy veg and leaf veg -> group to 'Rau củ dễ chăm' (frontend has only that veg label)
  if (plantGroup === 'root_vegetable' || plantGroup === 'leaf_vegetable') return 'Rau củ dễ chăm';

  // Short-term fruits
  if (plantGroup === 'fruit_short_term' || pTags.some(t => t.includes('trái cây') || t.includes('ngắn hạn'))) return 'Trái cây ngắn hạn';

  // Climbers
  if (tags.some(t => t.includes('leo') || t.includes('giàn')) || pTags.some(t => t.includes('leo') || t.includes('giàn'))) return 'Cây leo nhỏ';

  // Low maintenance cues
  if (tags.some(t => t.includes('ít thời gian') || t.includes('ít công') || t.includes('ít chăm'))) return 'Ít thời gian chăm sóc';

  return '';
}

async function run() {
  await connectDB();
  console.log('✅ Connected to MongoDB');

  const allGuides = await Guide.find({}).lean();
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(process.cwd(), 'scripts', `backup_guides_before_ensureFrontendCategory_${ts}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(allGuides, null, 2), 'utf-8');
  console.log(`🗄️  Backup saved to ${backupPath} (total ${allGuides.length} guides)`);

  let updated = 0;
  const changed = [];

  for (const g of allGuides) {
    const existing = (g.category || '').trim();
    let category = existing;

    // If the existing category is not one of the frontend labels, try to infer
    if (!FRONTEND_LABELS.includes(existing)) {
      category = inferCategory(g);
    }

    // Normalize tags: remove existing Loại:* and add Loại:<category> when category present
    const currentTags = Array.isArray(g.tags) ? [...g.tags] : [];
    const cleaned = currentTags.filter(t => !(typeof t === 'string' && t.startsWith('Loại:')));
    if (category) cleaned.push(`Loại:${category}`);

    const plantTags = Array.isArray(g.plantTags) ? [...g.plantTags] : [];
    if (category && !plantTags.includes(category)) plantTags.push(category);

    const needUpdate = (g.category !== category) || (JSON.stringify(cleaned) !== JSON.stringify(g.tags || [])) || (JSON.stringify(plantTags) !== JSON.stringify(g.plantTags || []));
    if (needUpdate) {
      await Guide.updateOne({ _id: g._id }, { $set: { category: category || '', tags: cleaned, plantTags } });
      updated++;
      changed.push({ _id: g._id, title: g.title, category: category || '', tags: cleaned, plantTags });
    }
  }

  console.log(`✅ Done. Updated ${updated} guides.`);
  if (changed.length) console.log(JSON.stringify(changed.slice(0, 20), null, 2));
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
