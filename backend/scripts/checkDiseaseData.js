// Test script to check diseases and categories in database
import mongoose from "mongoose";
import Disease from "../models/Disease.js";
import DiseaseCategory from "../models/DiseaseCategory.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/farmhub";

async function checkData() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Check categories
    const categories = await DiseaseCategory.find({ isDeleted: false });
    console.log("\n=== DISEASE CATEGORIES ===");
    console.log(`Total categories: ${categories.length}`);
    if (categories.length > 0) {
      categories.forEach((cat, idx) => {
        console.log(`${idx + 1}. ${cat.name} (${cat.slug}) - ${cat.icon || "🦠"}`);
      });
    } else {
      console.log("No categories found!");
    }

    // Check diseases
    const diseases = await Disease.find({ isDeleted: false });
    console.log("\n=== DISEASES ===");
    console.log(`Total diseases: ${diseases.length}`);
    if (diseases.length > 0) {
      diseases.forEach((disease, idx) => {
        console.log(`${idx + 1}. ${disease.name} (${disease.slug}) - Category: ${disease.category} - Severity: ${disease.severity}`);
      });
    } else {
      console.log("No diseases found!");
    }

    // Create sample data if empty
    if (categories.length === 0) {
      console.log("\n=== CREATING SAMPLE CATEGORIES ===");
      const sampleCategories = [
        { name: "Bệnh do vi khuẩn", slug: "benh-vi-khuan", icon: "🦠", description: "Các bệnh gây ra bởi vi khuẩn" },
        { name: "Bệnh do nấm", slug: "benh-nam", icon: "🍄", description: "Các bệnh gây ra bởi nấm" },
        { name: "Bệnh do virus", slug: "benh-virus", icon: "🦟", description: "Các bệnh gây ra bởi virus" },
        { name: "Sâu bệnh", slug: "sau-benh", icon: "🐛", description: "Sâu bệnh hại cây trồng" },
      ];

      for (const cat of sampleCategories) {
        const newCat = new DiseaseCategory(cat);
        await newCat.save();
        console.log(`Created: ${cat.name}`);
      }
    }

    if (diseases.length === 0) {
      console.log("\n=== CREATING SAMPLE DISEASES ===");
      const sampleDiseases = [
        {
          name: "Đạo ôn lúa",
          slug: "dao-on-lua",
          category: "Bệnh do nấm",
          severity: "high",
          plantTypes: ["Lúa"],
          description: "Bệnh đạo ôn lúa là bệnh phổ biến và nguy hiểm nhất đối với cây lúa",
        },
        {
          name: "Bạc lá lúa",
          slug: "bac-la-lua",
          category: "Bệnh do virus",
          severity: "medium",
          plantTypes: ["Lúa"],
          description: "Bệnh bạc lá lúa làm lá lúa chuyển màu bạc",
        },
        {
          name: "Héo xanh cà chua",
          slug: "heo-xanh-ca-chua",
          category: "Bệnh do vi khuẩn",
          severity: "high",
          plantTypes: ["Cà chua", "Ớt"],
          description: "Bệnh héo xanh gây héo và chết cây",
        },
        {
          name: "Sâu cuốn lá",
          slug: "sau-cuon-la",
          category: "Sâu bệnh",
          severity: "medium",
          plantTypes: ["Lúa", "Ngô"],
          description: "Sâu cuốn lá làm hại lá cây trồng",
        },
      ];

      for (const disease of sampleDiseases) {
        const newDisease = new Disease(disease);
        await newDisease.save();
        console.log(`Created: ${disease.name}`);
      }
    }

    console.log("\n=== CHECK COMPLETE ===");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkData();
