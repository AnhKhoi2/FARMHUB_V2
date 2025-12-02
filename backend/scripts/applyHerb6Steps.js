#!/usr/bin/env node
import 'dotenv/config';
import { connectDB } from '../config/db.js';
import PlantGroup from '../models/PlantGroup.js';
import Guide from '../models/Guide.js';

function normalize(s){ return String(s||'').trim().toLowerCase(); }

function buildSteps(plant){
  const name = plant;
  return [
    { title: 'Chuẩn bị đất', text: `Chuẩn bị đất tơi xốp, giàu mùn cho ${name}. Bón lót phân hữu cơ hoai mục để cung cấp dinh dưỡng nền.` },
    { title: 'Gieo/nhân giống', text: `Gieo hạt hoặc giâm cành ${name} theo hướng dẫn giống; giữ ẩm và chăm sóc giai đoạn nảy mầm/ra rễ.` },
    { title: 'Vị trí & ánh sáng', text: `${name} cần vị trí phù hợp: phần lớn các loại thảo mộc cần nắng nhẹ đến sáng cả ngày; một số ưa bóng râm nhẹ.` },
    { title: 'Tưới & dinh dưỡng', text: `Tưới đều giữ ẩm cho ${name} nhưng tránh ngập úng. Bón thúc phân hữu cơ hoặc phân lỏng loãng 2-4 tuần/lần tuỳ điều kiện.` },
    { title: 'Chăm sóc & phòng bệnh', text: `Kiểm tra sâu bệnh (rệp, nhện, nấm) và loại bỏ lá bệnh; cắt tỉa để kích thích ra chồi non và giữ thông thoáng.` },
    { title: 'Thu hoạch & bảo quản', text: `Thu lá hoặc phần dùng khi đạt kích thước phù hợp; sử dụng tươi hoặc bảo quản bằng phơi/đông lạnh tùy mục đích.` }
  ];
}

async function main(){
  await connectDB();
  const slug = 'herb';
  const pg = await PlantGroup.findOne({ slug }).lean();
  if(!pg){ console.error(`PlantGroup '${slug}' not found`); process.exit(1); }

  const excluded = new Set(['ngò rí'.normalize ? 'ngò rí' : 'Ngò rí']);
  // normalize excludes: we'll compare lowercased
  const plants = (pg.plants || []).map(p => p && p.name ? String(p.name).trim() : null).filter(Boolean);

  let updated=0, missing=0, created=0, skipped=0;
  for(const plant of plants){
    if(!plant) continue;
    if(normalize(plant) === normalize('Ngò rí')){ skipped++; continue; }
    const steps = buildSteps(plant);
    const title = `Hướng dẫn trồng ${plant}`;

    // find existing guide for this plant
    const g = await Guide.findOne({ plant_group: slug, plant_name: { $regex: `^${plant.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}$`, $options: 'i' } });
    if(g){
      g.title = title;
      g.description = `Hướng dẫn cơ bản để trồng ${plant}`;
      g.steps = steps;
      g.plantTags = Array.from(new Set([...(g.plantTags||[]), plant]));
      await g.save();
      updated++;
      console.log(`Updated guide for ${plant} (${g._id})`);
    } else {
      // create only if desired — create to ensure UI has guide
      const newg = new Guide({ expert_id: null, title, description: `Hướng dẫn cơ bản để trồng ${plant}`, content: `<p>Hướng dẫn cơ bản để trồng ${plant}.</p>`, steps, plant_group: slug, plant_name: plant, plantTags: [plant], status: 'published' });
      await newg.save();
      created++;
      console.log(`Created guide for ${plant} (${newg._id})`);
    }
  }

  console.log(`Done. Updated: ${updated}, Created: ${created}, Skipped (Ngò rí): ${skipped}`);
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });