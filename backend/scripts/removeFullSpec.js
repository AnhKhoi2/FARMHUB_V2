import mongoose from 'mongoose';
import Guide from '../models/Guide.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO = process.env.MONGODB_CONNECTIONSTRING || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/farmhub_v2';

async function run() {
  try {
    await mongoose.connect(MONGO, { dbName: process.env.MONGODB_DB || undefined });
    console.log('✅ Connected to MongoDB');

    const docs = await Guide.find({ full_spec: { $exists: true } }).lean();
    console.log(`Found ${docs.length} guide(s) that have full_spec.`);

    if (!docs.length) {
      await mongoose.connection.close();
      console.log('No documents to update. Exiting.');
      return;
    }

    const outDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(outDir, `full_spec_backup_${ts}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(docs, null, 2), 'utf8');
    console.log('Backup written to', backupPath);

    const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-n');
    if (dryRun) {
      console.log('\n-- Dry run mode --');
      console.log('Sample IDs to be updated (up to 20):');
      docs.slice(0, 20).forEach(d => console.log(`- ${d._id} (${d.plant_name || '<no-name>'})`));
      console.log(`\n✅ Would remove \`full_spec\` from ${docs.length} guide(s).`);
      await mongoose.connection.close();
      return;
    }

    // Apply update
    const res = await Guide.updateMany({ full_spec: { $exists: true } }, { $unset: { full_spec: '' } });
    console.log(`\n✅ Unset full_spec on ${res.modifiedCount || res.nModified || res.modified || 0} document(s).`);

    const resultPath = path.join(outDir, `full_spec_remove_result_${ts}.json`);
    fs.writeFileSync(resultPath, JSON.stringify({ matched: docs.length, modified: res.modifiedCount || res.nModified || res.modified || 0 }, null, 2), 'utf8');
    console.log('Result written to', resultPath);

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error during removeFullSpec:', err);
    process.exit(1);
  }
}

run();
