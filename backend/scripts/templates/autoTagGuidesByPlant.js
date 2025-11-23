import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectDB } from "../config/db.js";
import Guide from "../models/Guide.js";

/**
 * Auto-assign tags and plantTags to guides based on `plant_name` and `plant_group`.
 * - Creates backup of all guides before updating
 * - Uses a mapping for common plants and heuristics for others
 * Usage: node backend/scripts/autoTagGuidesByPlant.js
 */

const frontendLabels = {
  veg_easy: 'Rau củ dễ chăm',
  fruit_short: 'Trái cây ngắn hạn',
  herb: 'Cây gia vị',
  apartment: 'Trồng trong chung cư',
  low_maint: 'Ít thời gian chăm sóc',
  climber: 'Cây leo nhỏ',
};

const plantMap = {
  'Dưa leo': { plant_group: 'fruit_short_term', plantTags: ['Cây ăn quả ngắn hạn','Leo giàn','Ban công','Chậu lớn'], tags: ['Ban công'] , category: frontendLabels.apartment},
  'Cà chua bi': { plant_group: 'fruit_short_term', plantTags: ['Cây ăn quả ngắn hạn','Leo giàn','Ban công','Chậu lớn'], tags: ['Ban công'], category: frontendLabels.apartment},
  'Dâu tây': { plant_group: 'fruit_short_term', plantTags: ['Cây ăn quả ngắn hạn','Ban công','Chậu treo'], tags: ['Ban công','Chậu treo'], category: frontendLabels.apartment},
  'Ớt chuông': { plant_group: 'fruit_short_term', plantTags: ['Cây ăn quả ngắn hạn','Ban công','Chậu lớn'], tags: ['Ban công'], category: frontendLabels.apartment},
  'Mướp': { plant_group: 'fruit_short_term', plantTags: ['Cây ăn quả ngắn hạn','Leo giàn','Ban công'], tags: ['Ban công'], category: frontendLabels.apartment},

  'Xà lách': { plant_group: 'leaf_vegetable', plantTags: ['Rau ăn lá','Thu hoạch nhanh','Ban công','Chậu nông'], tags: ['Ban công'], category: frontendLabels.apartment},
  'Rau muống': { plant_group: 'leaf_vegetable', plantTags: ['Rau ăn lá','Thu hoạch nhanh','Ban công','Chậu nông'], tags: ['Ban công'], category: frontendLabels.apartment},
  'Cải xanh': { plant_group: 'leaf_vegetable', plantTags: ['Rau ăn lá','Thu hoạch nhanh','Ban công'], tags: ['Ban công'], category: frontendLabels.apartment},
  'Rau thơm hỗn hợp': { plant_group: 'leaf_vegetable', plantTags: ['Rau ăn lá','Thu hoạch nhanh','Ban công','Thảo mộc/Gia vị'], tags: ['Ban công'], category: frontendLabels.apartment},
  'Rau mầm': { plant_group: 'leaf_vegetable', plantTags: ['Rau ăn lá','Thu hoạch nhanh','Ban công','Chậu nông'], tags: ['Ban công'], category: frontendLabels.apartment},

  'Cà rốt baby': { plant_group: 'root_vegetable', plantTags: ['Rau củ','Chậu sâu','Ban công'], tags: ['Chậu sâu'], category: frontendLabels.veg_easy},
  'Củ cải trắng': { plant_group: 'root_vegetable', plantTags: ['Rau củ','Chậu sâu','Ban công'], tags: ['Chậu sâu'], category: frontendLabels.veg_easy},
  'Củ hành nhỏ': { plant_group: 'root_vegetable', plantTags: ['Rau củ','Chậu sâu','Ban công'], tags: ['Chậu sâu'], category: frontendLabels.veg_easy},
  'Củ cải đỏ': { plant_group: 'root_vegetable', plantTags: ['Rau củ','Chậu sâu','Ban công'], tags: ['Chậu sâu'], category: frontendLabels.veg_easy},
  'Khoai tây mini': { plant_group: 'root_vegetable', plantTags: ['Rau củ','Chậu sâu','Ban công'], tags: ['Chậu sâu'], category: frontendLabels.veg_easy},

  'Húng quế': { plant_group: 'herb', plantTags: ['Gia vị','Chậu nhỏ','Thảo mộc/Gia vị'], tags: ['Chậu nhỏ'], category: frontendLabels.herb},
  'Hành lá': { plant_group: 'herb', plantTags: ['Gia vị','Chậu nhỏ','Thảo mộc/Gia vị'], tags: ['Chậu nhỏ'], category: frontendLabels.herb},
  'Ngò rí': { plant_group: 'herb', plantTags: ['Gia vị','Chậu nhỏ','Thảo mộc/Gia vị'], tags: ['Chậu nhỏ'], category: frontendLabels.herb},
  'Sả': { plant_group: 'herb', plantTags: ['Gia vị','Chậu nhỏ','Thảo mộc/Gia vị'], tags: ['Chậu nhỏ'], category: frontendLabels.herb},
  'Hương thảo': { plant_group: 'herb', plantTags: ['Gia vị','Chậu nhỏ','Thảo mộc/Gia vị'], tags: ['Chậu nhỏ'], category: frontendLabels.herb},

  'Ổi lùn': { plant_group: 'other', plantTags: ['Sân thượng','Ban công','Chậu treo'], tags: ['Ban công'], category: frontendLabels.apartment},
  'Chanh dây nhỏ': { plant_group: 'other', plantTags: ['Sân thượng','Ban công','Chậu treo'], tags: ['Ban công'], category: frontendLabels.apartment},
  'Lê cảnh nhỏ': { plant_group: 'other', plantTags: ['Sân thượng','Ban công','Chậu treo'], tags: ['Ban công'], category: frontendLabels.apartment},
};

function dedupe(arr) { return Array.from(new Set((arr || []).filter(Boolean))); }

function inferFromGroup(g) {
  const grp = g.plant_group || '';
  if (grp === 'herb') return { plantTags: ['Gia vị','Thảo mộc/Gia vị'], tags: ['Chậu nhỏ'], category: frontendLabels.herb };
  if (grp === 'leaf_vegetable') return { plantTags: ['Rau ăn lá','Thu hoạch nhanh'], tags: ['Ban công'], category: frontendLabels.veg_easy };
  if (grp === 'root_vegetable') return { plantTags: ['Rau củ'], tags: ['Chậu sâu'], category: frontendLabels.veg_easy };
  if (grp === 'fruit_short_term') return { plantTags: ['Cây ăn quả ngắn hạn'], tags: ['Ban công'], category: frontendLabels.fruit_short };
  return { plantTags: ['Khác'], tags: [], category: '' };
}

async function run() {
  await connectDB();
  console.log('✅ Connected to MongoDB');

  const all = await Guide.find({}).lean();
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const backup = path.join(process.cwd(), 'scripts', `backup_guides_before_autotag_${ts}.json`);
  fs.writeFileSync(backup, JSON.stringify(all, null, 2), 'utf-8');
  console.log(`🗄️  Backup created: ${backup} (total ${all.length} guides)`);

  let updated = 0; const sample = [];
  for (const g of all) {
    const name = (g.plant_name || g.title || '').trim();
    let mapping = plantMap[name];
    if (!mapping) mapping = inferFromGroup(g);

    const newPlantTags = dedupe([...(g.plantTags||[]), ...(mapping.plantTags||[])]);
    const existingTags = Array.isArray(g.tags) ? [...g.tags] : [];
    const cleanedTags = existingTags.filter(t => !(typeof t === 'string' && t.startsWith('Loại:')));
    const mergedTags = dedupe([...cleanedTags, ...(mapping.tags||[])]);

    const category = mapping.category || g.category || '';
    if (category) {
      const finalTags = mergedTags.filter(t => !(typeof t === 'string' && t.startsWith('Loại:')));
      finalTags.push(`Loại:${category}`);
      if (!newPlantTags.includes(category)) newPlantTags.push(category);

      const needUpdate = (g.category !== category) || (JSON.stringify(finalTags) !== JSON.stringify(g.tags || [])) || (JSON.stringify(newPlantTags) !== JSON.stringify(g.plantTags || []));
      if (needUpdate) {
        await Guide.updateOne({ _id: g._id }, { $set: { category: category, tags: finalTags, plantTags: newPlantTags } });
        updated++; sample.push({ _id: g._id, title: g.title, plant_name: g.plant_name, category, tags: finalTags, plantTags: newPlantTags });
      }
    } else {
      const needUpdate = (JSON.stringify(mergedTags) !== JSON.stringify(g.tags || [])) || (JSON.stringify(newPlantTags) !== JSON.stringify(g.plantTags || []));
      if (needUpdate) {
        await Guide.updateOne({ _id: g._id }, { $set: { tags: mergedTags, plantTags: newPlantTags } });
        updated++; sample.push({ _id: g._id, title: g.title, plant_name: g.plant_name, category: g.category||'', tags: mergedTags, plantTags: newPlantTags });
      }
    }
  }

  console.log(`✅ Done. Updated ${updated} guides.`);
  if (sample.length) console.log(JSON.stringify(sample.slice(0,50), null, 2));
  process.exit(0);
}

run().catch(err => { console.error('❌ Error', err); process.exit(1); });
