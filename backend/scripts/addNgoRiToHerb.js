#!/usr/bin/env node
import 'dotenv/config';
import { connectDB } from '../config/db.js';
import PlantGroup from '../models/PlantGroup.js';
import Guide from '../models/Guide.js';

function normalize(s){
  return String(s||'').trim().toLowerCase();
}

async function main(){
  await connectDB();
  const slug = 'herb';
  const pg = await PlantGroup.findOne({ slug });
  if(!pg){
    console.error(`PlantGroup with slug='${slug}' not found`);
    process.exit(1);
  }

  const targetName = 'Ngò rí';
  const exists = (pg.plants || []).some(p => normalize(p.name) === normalize(targetName));
  if(!exists){
    pg.plants = pg.plants || [];
    pg.plants.push({ name: targetName, slug: 'ngo-ri' });
    await pg.save();
    console.log(`Added plant entry '${targetName}' to PlantGroup '${slug}'`);
  } else {
    console.log(`Plant entry '${targetName}' already exists in PlantGroup '${slug}'`);
  }

  // Update guides with plant_name 'Ngò rí' to ensure they belong to herb and have plantTags
  const guide = await Guide.findOne({ plant_name: { $regex: `^${targetName.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$$`, $options: 'i' } });
  if(guide){
    let changed = false;
    if(guide.plant_group !== slug){ guide.plant_group = slug; changed = true; }
    guide.plantTags = Array.from(new Set([...(guide.plantTags||[]), targetName]));
    if(!guide.title || !guide.title.toLowerCase().includes('ngò rí')){
      guide.title = `Hướng dẫn trồng ${targetName}`;
      changed = true;
    }
    if(changed) {
      await guide.save();
      console.log(`Updated guide ${guide._id} to match plant '${targetName}'`);
    } else {
      console.log(`Guide ${guide._id} already matches plant '${targetName}'`);
    }
  } else {
    console.log(`No existing guide found with plant_name='${targetName}'. Creating a basic guide.`);
    const steps = [
      { title: 'Chuẩn bị đất', text: 'Đất tơi xốp, giàu hữu cơ; làm luống cao nếu vùng ẩm.' },
      { title: 'Gieo/nhân giống', text: 'Gieo hạt mỏng, phủ nhẹ, giữ ẩm; hoặc giâm cành.' },
      { title: 'Ánh sáng', text: 'Ưa bán nắng; tránh nắng gắt.' },
      { title: 'Tưới & bón', text: 'Tưới đều, bón phân hữu cơ nhẹ.' },
      { title: 'Chăm sóc', text: 'Loại bỏ bệnh, kiểm soát rệp.' },
      { title: 'Thu hoạch', text: 'Thu lá khi cây đạt kích thước sử dụng.' }
    ];
    const g = new Guide({
      expert_id: null,
      title: `Hướng dẫn trồng ${targetName}`,
      description: `Hướng dẫn cơ bản để trồng ${targetName}`,
      content: `<p>Hướng dẫn cơ bản để trồng ${targetName}.</p>`,
      steps,
      plant_group: slug,
      plant_name: targetName,
      plantTags: [targetName],
      status: 'published'
    });
    await g.save();
    console.log('Created guide for', targetName, g._id.toString());
  }

  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });