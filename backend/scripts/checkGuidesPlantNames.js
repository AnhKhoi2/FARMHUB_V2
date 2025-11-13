import mongoose from "mongoose";
import Guide from "../models/Guide.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkGuidesPlantNames() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/farmhub_v2"
    );
    console.log("✅ Connected to MongoDB");

    const guides = await Guide.find({ deleted: { $ne: true } })
      .select("guide_id title plant_name plant_group plantTags")
      .lean();

    console.log(`\n📊 Total guides: ${guides.length}`);

    const withPlantName = guides.filter(
      (g) => g.plant_name && g.plant_name.trim()
    );
    const withoutPlantName = guides.filter(
      (g) => !g.plant_name || !g.plant_name.trim()
    );

    console.log(`✅ Guides with plant_name: ${withPlantName.length}`);
    console.log(`❌ Guides without plant_name: ${withoutPlantName.length}\n`);

    if (withPlantName.length > 0) {
      console.log("📋 Guides with plant_name:");
      withPlantName.forEach((g) => {
        console.log(`  - "${g.title}" → plant_name: "${g.plant_name}"`);
      });
    }

    if (withoutPlantName.length > 0) {
      console.log("\n⚠️  Guides without plant_name:");
      withoutPlantName.slice(0, 5).forEach((g) => {
        console.log(`  - "${g.title}" (${g.guide_id})`);
      });
      if (withoutPlantName.length > 5) {
        console.log(`  ... and ${withoutPlantName.length - 5} more`);
      }
    }

    // Extract unique plant names
    const uniquePlantNames = [
      ...new Set(withPlantName.map((g) => g.plant_name.trim()).filter(Boolean)),
    ];

    console.log(`\n🌱 Unique plant names (${uniquePlantNames.length}):`);
    uniquePlantNames.forEach((name) => console.log(`  - ${name}`));

    await mongoose.connection.close();
    console.log("\n✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkGuidesPlantNames();
