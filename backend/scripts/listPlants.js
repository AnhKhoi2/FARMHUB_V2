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

const PlantSchema = new mongoose.Schema({}, { strict: false });
const Plant = mongoose.model("Plant", PlantSchema, "plants");

async function main() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB");

    const docs = await Plant.find({}).lean().sort({ name: 1 });
    if (!docs || docs.length === 0) {
      console.log("No plants found in collection 'plants'.");
      return;
    }

    console.log(`Found ${docs.length} plant(s):`);
    let i = 0;
    for (const d of docs) {
      i += 1;
      const name = d.name || "<no-name>";
      const slug =
        d.slug ||
        d.name?.toString().toLowerCase().replace(/\s+/g, "-") ||
        "<no-slug>";
      const pg =
        d.plant_group || d.plantGroup || d.plantGroupId || "<no-plant_group>";
      console.log(`${i}. ${name} (slug: ${slug}) - plant_group: ${pg}`);
    }
  } catch (err) {
    console.error("Error querying plants collection:", err.message || err);
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(0);
  }
}

main();
