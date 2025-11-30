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

const PlantGroupSchema = new mongoose.Schema({}, { strict: false });
const PlantGroup = mongoose.model(
  "PlantGroup",
  PlantGroupSchema,
  "plantgroups"
);

async function main() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB");

    const docs = await PlantGroup.find({}).lean();
    if (!docs || docs.length === 0) {
      console.log("No plant groups found in collection 'plantgroups'.");
    } else {
      console.log(`Found ${docs.length} plant group(s):`);
      for (const d of docs) {
        const plantsCount = Array.isArray(d.plants) ? d.plants.length : 0;
        console.log(
          `- ${d.name || "<no-name>"} (slug: ${
            d.slug || "<no-slug>"
          }) - plants: ${plantsCount}`
        );
      }
    }
  } catch (err) {
    console.error("Error querying plantgroups:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
