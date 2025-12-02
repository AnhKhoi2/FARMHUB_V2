#!/usr/bin/env node
import 'dotenv/config';
import { connectDB } from '../config/db.js';
import PlantGroup from '../models/PlantGroup.js';
import Guide from '../models/Guide.js';

async function run() {
  await connectDB();
  const slug = 'herb';
  const pg = await PlantGroup.findOne({ slug }).lean();
  if (!pg) {
    console.log(`No PlantGroup found with slug='${slug}'`);
    process.exit(0);
  }

  // collect canonical plant names from plant entries and plant group name itself
  const plantNames = new Set();
  if (Array.isArray(pg.plants)) {
    pg.plants.forEach(p => { if (p && p.name) plantNames.add(String(p.name).trim()); });
  }
  if (pg.name) plantNames.add(String(pg.name).trim());

  console.log(`PlantGroup '${slug}' name:`, pg.name);
  console.log(`Plant entries (${plantNames.size}):`, Array.from(plantNames));

  // find guides with plant_group = 'herb'
  const guides = await Guide.find({ plant_group: slug }).lean();
  console.log(`Found ${guides.length} guides with plant_group='${slug}'`);

  const matches = [];
  const missing = [];
  for (const g of guides) {
    const pname = (g.plant_name || '').trim();
    if (!pname) {
      missing.push({ id: g._id, title: g.title, plant_name: g.plant_name });
      continue;
    }
    // match ignoring case
    const found = Array.from(plantNames).some(n => n.toLowerCase() === pname.toLowerCase());
    if (found) matches.push({ id: g._id, title: g.title, plant_name: pname });
    else missing.push({ id: g._id, title: g.title, plant_name: pname });
  }

  console.log('\nMatches (' + matches.length + '):');
  matches.forEach(m => console.log('-', m.plant_name, '|', m.title, '|', m.id));

  console.log('\nMissing (not in PlantGroup entries) (' + missing.length + '):');
  missing.forEach(m => console.log('-', m.plant_name || '<EMPTY>', '|', m.title, '|', m.id));

  // Also list plantNames not represented by any guide
  const guidePlantNames = new Set(guides.map(g => (g.plant_name || '').trim()).filter(Boolean).map(s=>s.toLowerCase()));
  const notRepresented = Array.from(plantNames).filter(n => !guidePlantNames.has(n.toLowerCase()));
  console.log('\nPlant entries in PlantGroup but without a guide (' + notRepresented.length + '):', notRepresented);

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });