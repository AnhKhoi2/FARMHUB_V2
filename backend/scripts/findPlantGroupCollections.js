#!/usr/bin/env node
import mongoose from "mongoose";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .option("mongoUri", { type: "string", describe: "MongoDB URI" })
  .help(false).argv;
const MONGO_URI =
  argv.mongoUri ||
  process.env.MONGODB_CONNECTIONSTRING ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/farmhub";

async function looksLikePlantGroup(doc) {
  if (!doc || typeof doc !== "object") return false;
  // Heuristics: has name + slug + plants array OR plant_group / plantGroup keys
  if (doc.name && doc.slug && Array.isArray(doc.plants)) return true;
  if (doc.plant_group || doc.plantGroup || doc.plant_groups) return true;
  // plants array of subdocs with name fields
  if (
    Array.isArray(doc.plants) &&
    doc.plants.some((p) => p && (p.name || p.slug))
  )
    return true;
  return false;
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB");
    const adminDb = mongoose.connection.db;
    const cols = await adminDb.listCollections().toArray();
    if (!cols || cols.length === 0) {
      console.log("No collections found.");
      return;
    }

    console.log(
      `Found ${cols.length} collections. Scanning for plant-group-like documents...`
    );
    const candidates = [];
    for (const c of cols) {
      const name = c.name;
      try {
        const coll = adminDb.collection(name);
        const count = await coll.countDocuments();
        const sample = await coll.find({}).limit(5).toArray();
        const matches = sample.map((d) => ({
          doc: d,
          match: !!looksLikePlantGroup(d),
        }));
        const anyMatch = matches.some((m) => m.match);
        if (anyMatch) candidates.push({ name, count, matches });
        // print short progress
        console.log(
          `- ${name} (count: ${count})${anyMatch ? " <-- candidate" : ""}`
        );
      } catch (err) {
        console.warn(`Could not read collection ${name}:`, err.message);
      }
    }

    if (candidates.length === 0) {
      console.log("\nNo candidate collections detected by heuristics.");
    } else {
      console.log(`\nCandidate collections (${candidates.length}):`);
      for (const c of candidates) {
        console.log(`\nCollection: ${c.name} (documents: ${c.count})`);
        for (const m of c.matches) {
          console.log("--- sample doc ---");
          // Print main identifying fields only
          const out = {};
          if (m.doc._id) out._id = m.doc._id;
          if (m.doc.name) out.name = m.doc.name;
          if (m.doc.slug) out.slug = m.doc.slug;
          if (m.doc.plants)
            out.plants = Array.isArray(m.doc.plants)
              ? m.doc.plants.slice(0, 3)
              : m.doc.plants;
          if (m.doc.plant_group) out.plant_group = m.doc.plant_group;
          console.log(JSON.stringify(out, null, 2));
        }
      }
    }
  } catch (err) {
    console.error("Error connecting or scanning DB:", err.message || err);
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(0);
  }
}

main();
