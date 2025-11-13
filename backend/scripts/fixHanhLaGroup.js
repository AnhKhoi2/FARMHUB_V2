import "dotenv/config";
import mongoose from "mongoose";
import Guide from "../models/Guide.js";

async function fixHanhLaGroup() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    console.log("✅ Connected to MongoDB\n");

    // Cập nhật Guide "Hành lá" từ "herb" → "leaf_vegetable"
    const result = await Guide.updateOne(
      { plant_name: /hành lá/i },
      { $set: { plant_group: "leaf_vegetable" } }
    );

    if (result.matchedCount > 0) {
      console.log("✅ Updated Guide 'Hành lá':");
      console.log(`   Changed plant_group: "herb" → "leaf_vegetable"`);
      console.log(`   Modified: ${result.modifiedCount} document(s)`);

      const updatedGuide = await Guide.findOne({ plant_name: /hành lá/i });
      console.log("\n✅ Verified:");
      console.log(`   Title: ${updatedGuide.title}`);
      console.log(`   Plant Group: ${updatedGuide.plant_group}`);
    } else {
      console.log("❌ No Guide found with 'Hành lá'");
    }

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    console.log(
      "\n💡 Bây giờ khi tạo notebook với guide 'Hành lá', sẽ tự động match với template 'Rau ăn lá cơ bản'"
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixHanhLaGroup();
