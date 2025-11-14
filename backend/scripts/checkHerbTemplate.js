import "dotenv/config";
import mongoose from "mongoose";
import PlantTemplate from "../models/PlantTemplate.js";
import Guide from "../models/Guide.js";

async function checkHerbTemplate() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    console.log("✅ Connected to MongoDB\n");

    // 1. Kiểm tra Guide "Hành lá"
    console.log("🔍 Checking Guide for 'Hành lá':");
    const hanhLaGuide = await Guide.findOne({
      $or: [{ plant_name: /hành lá/i }, { title: /hành lá/i }],
    });

    if (hanhLaGuide) {
      console.log("✅ Found Guide:");
      console.log(`   ID: ${hanhLaGuide._id}`);
      console.log(`   Title: ${hanhLaGuide.title}`);
      console.log(`   Plant Name: ${hanhLaGuide.plant_name}`);
      console.log(`   Plant Group: ${hanhLaGuide.plant_group}`);
      console.log(`   Status: ${hanhLaGuide.status}`);
    } else {
      console.log("❌ No Guide found for 'Hành lá'");
    }

    console.log("\n" + "=".repeat(60) + "\n");

    // 2. Kiểm tra tất cả templates
    console.log("🔍 Checking all PlantTemplates:");
    const allTemplates = await PlantTemplate.find({});

    console.log(`\n📊 Total templates: ${allTemplates.length}\n`);

    allTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.template_name}`);
      console.log(`   Plant Group: ${template.plant_group}`);
      console.log(`   Status: ${template.status}`);
      console.log(
        `   Examples: ${template.plant_examples?.join(", ") || "N/A"}`
      );
      console.log("");
    });

    console.log("=".repeat(60) + "\n");

    // 3. Tìm template cho "herb" group
    if (hanhLaGuide) {
      console.log(
        `🔍 Looking for template with plant_group = "${hanhLaGuide.plant_group}":`
      );

      const matchingTemplate = await PlantTemplate.findOne({
        plant_group: hanhLaGuide.plant_group,
        status: "active",
      });

      if (matchingTemplate) {
        console.log("✅ Found matching template:");
        console.log(`   ID: ${matchingTemplate._id}`);
        console.log(`   Name: ${matchingTemplate.template_name}`);
        console.log(`   Plant Group: ${matchingTemplate.plant_group}`);
        console.log(`   Status: ${matchingTemplate.status}`);
      } else {
        console.log(
          `❌ No active template found for plant_group: "${hanhLaGuide.plant_group}"`
        );
        console.log("\n💡 Solution:");
        console.log("   1. Create a template with plant_group: 'herb'");
        console.log(
          "   2. OR change Guide's plant_group to match existing template"
        );
        console.log("   3. OR manually assign template to notebook");
      }
    }

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkHerbTemplate();
