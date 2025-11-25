import mongoose from "mongoose";
import PlantTemplate from "../models/PlantTemplate.js";

async function addWeightToTemplates() {
  try {
    await mongoose.connect("mongodb://localhost:27017/farmhub");
    console.log("✅ MongoDB connected");

    const templates = await PlantTemplate.find();
    console.log(`📋 Found ${templates.length} templates`);

    for (const template of templates) {
      const stageCount = template.stages.length;
      const defaultWeight = Math.round(100 / stageCount);
      let remainingWeight = 100;

      console.log(`\n🔧 Updating template: ${template.template_name}`);
      console.log(`   Stages: ${stageCount}`);
      console.log(`   Default weight per stage: ${defaultWeight}%`);

      // Update weights cho từng stage
      template.stages.forEach((stage, index) => {
        if (index === stageCount - 1) {
          // Stage cuối cùng lấy phần còn lại để tổng = 100%
          stage.weight = remainingWeight;
        } else {
          stage.weight = defaultWeight;
          remainingWeight -= defaultWeight;
        }
        console.log(
          `   Stage ${stage.stage_number}: ${stage.name} = ${stage.weight}%`
        );
      });

      await template.save();
      console.log(`✅ Updated template: ${template.template_name}`);
    }

    console.log("\n🎉 All templates updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

addWeightToTemplates();
