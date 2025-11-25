import "dotenv/config";
import { connectDB } from "../config/db.js";
import Guide from "../models/Guide.js";
import User from "../models/User.js";

/**
 * 🌱 Script Seed Guides với plant_group
 * Chạy: node backend/scripts/seedGuidesWithPlantGroup.js
 */

const samples = [
  // === RAU ĂN LÁ (LEAF VEGETABLE) ===
  {
    title: "Hướng dẫn trồng Xà lách",
    plant_name: "Xà lách",
    plant_group: "leaf_vegetable",
    description:
      "Xà lách dễ trồng, thu hoạch nhanh, phù hợp trồng trong chậu ban công.",
    content: "<p>Xà lách là rau ăn lá phổ biến, chu kỳ 30-40 ngày.</p>",
    image: "guides/xa-lach.jpg",
    plantTags: ["Rau ăn lá", "Dễ trồng", "Ban công"],
    steps: [
      {
        title: "Chuẩn bị",
        text: "Gieo hạt vào khay ươm hoặc chậu nhỏ, giá thể tơi xốp.",
        image: "guides/step1.jpg",
      },
      {
        title: "Chăm sóc",
        text: "Tưới đều, giữ ẩm, đặt nơi ánh sáng gián tiếp 4-6 giờ/ngày.",
        image: "guides/step2.jpg",
      },
      {
        title: "Thu hoạch",
        text: "Thu hoạch sau 30-40 ngày khi lá đủ lớn.",
        image: "guides/step3.jpg",
      },
    ],
    status: "published",
  },
  {
    title: "Cách trồng Rau muống nước",
    plant_name: "Rau muống",
    plant_group: "leaf_vegetable",
    description: "Rau muống nước phát triển cực nhanh, cắt tỉa liên tục.",
    content: "<p>Rau muống ưa môi trường ẩm, có thể trồng trong xô nước.</p>",
    plantTags: ["Rau ăn lá", "Trồng nước", "Phát triển nhanh"],
    steps: [
      {
        title: "Chuẩn bị",
        text: "Cắt cành rau muống 20-25cm, cắm vào xô có nước hoặc đất ẩm.",
      },
      {
        title: "Chăm sóc",
        text: "Đảm bảo luôn có nước, đặt nơi nhiều ánh sáng.",
      },
      {
        title: "Thu hoạch",
        text: "Cắt ngọn sau 15-20 ngày, cây sẽ tái sinh liên tục.",
      },
    ],
    status: "published",
  },
  {
    title: "Trồng Cải xanh trong chậu",
    plant_name: "Cải xanh",
    plant_group: "leaf_vegetable",
    description: "Cải xanh dễ chăm, phù hợp người mới bắt đầu.",
    content: "<p>Cải xanh thu hoạch sau 25-35 ngày, chịu nhiệt tốt.</p>",
    plantTags: ["Rau ăn lá", "Dễ trồng", "Chịu nhiệt"],
    steps: [
      {
        title: "Gieo hạt",
        text: "Gieo hạt trực tiếp vào chậu, phủ lớp đất mỏng.",
      },
      { title: "Tưới nước", text: "Tưới 2 lần/ngày, giữ đất ẩm." },
      { title: "Thu hoạch", text: "Thu hoạch khi cây cao 20-25cm." },
    ],
    status: "published",
  },

  // === CÂY CỦ (ROOT VEGETABLE) ===
  {
    title: "Trồng Củ cải trắng baby",
    plant_name: "Củ cải trắng",
    plant_group: "root_vegetable",
    description:
      "Củ cải trắng baby thu hoạch sau 40-50 ngày, phù hợp chậu sâu.",
    content: "<p>Củ cải cần chậu sâu ít nhất 25cm để củ phát triển.</p>",
    plantTags: ["Cây củ", "Chậu sâu", "Trung bình"],
    steps: [
      { title: "Chuẩn bị", text: "Chọn chậu sâu 30cm, đất tơi xốp." },
      { title: "Gieo hạt", text: "Gieo hạt cách nhau 5-7cm, phủ đất mỏng." },
      { title: "Chăm sóc", text: "Tưới đều, tránh ngập úng." },
      { title: "Thu hoạch", text: "Nhổ củ sau 45-50 ngày." },
    ],
    status: "published",
  },
  {
    title: "Cách trồng Cà rốt baby",
    plant_name: "Cà rốt baby",
    plant_group: "root_vegetable",
    description: "Cà rốt baby phù hợp trồng trong chậu, ngọt và giòn.",
    content: "<p>Cà rốt baby có củ nhỏ, dễ trồng hơn cà rốt thường.</p>",
    plantTags: ["Cây củ", "Chậu trung", "Dễ hơn"],
    steps: [
      { title: "Chọn giống", text: "Chọn giống cà rốt baby, hạt nhỏ." },
      { title: "Gieo", text: "Gieo hạt cách nhau 3-4cm." },
      { title: "Tưới", text: "Tưới nhẹ, giữ đất ẩm đều." },
      { title: "Thu hoạch", text: "Thu hoạch sau 60-70 ngày." },
    ],
    status: "published",
  },

  // === RAU QUẢ NGẮN NGÀY (FRUIT SHORT TERM) ===
  {
    title: "Trồng Dưa leo trên ban công",
    plant_name: "Dưa leo",
    plant_group: "fruit_short_term",
    description: "Dưa leo leo giàn, thu hoạch sau 50-60 ngày.",
    content: "<p>Dưa leo cần giàn leo và ánh sáng tốt.</p>",
    plantTags: ["Rau quả", "Leo giàn", "Thu hoạch nhanh"],
    steps: [
      { title: "Chuẩn bị", text: "Chậu lớn 30L, giàn leo hoặc lưới." },
      { title: "Gieo", text: "Gieo 2-3 hạt/chậu, chọn cây khỏe nhất." },
      { title: "Chăm sóc", text: "Dẫn dây leo, tỉa nhánh phụ." },
      { title: "Thu hoạch", text: "Hái quả sau 50-60 ngày khi đủ size." },
    ],
    status: "published",
  },
  {
    title: "Hướng dẫn trồng Cà chua bi",
    plant_name: "Cà chua bi",
    plant_group: "fruit_short_term",
    description: "Cà chua bi quả nhỏ, ngọt, dễ chăm sóc hơn cà chua lớn.",
    content: "<p>Cà chua bi thích hợp trồng trong chậu 20-30L.</p>",
    plantTags: ["Rau quả", "Quả nhỏ", "Dễ chăm"],
    steps: [
      { title: "Chọn giống", text: "Chọn cà chua bi F1, chống bệnh tốt." },
      { title: "Trồng", text: "Trồng cây con vào chậu, dựng cọc." },
      { title: "Chăm sóc", text: "Tỉa lá già, bón phân NPK." },
      { title: "Thu hoạch", text: "Hái quả chín đỏ sau 70-80 ngày." },
    ],
    status: "published",
  },
  {
    title: "Trồng Ớt chuông ngọt",
    plant_name: "Ớt chuông",
    plant_group: "fruit_short_term",
    description: "Ớt chuông ngọt, màu sắc đẹp, giàu vitamin C.",
    content: "<p>Ớt chuông cần nhiều ánh sáng và bón phân đầy đủ.</p>",
    plantTags: ["Rau quả", "Ngọt", "Đẹp mắt"],
    steps: [
      { title: "Chuẩn bị", text: "Chậu 15-20L, đất giàu dinh dưỡng." },
      { title: "Trồng", text: "Trồng cây con, khoảng cách 30cm." },
      { title: "Chăm sóc", text: "Tưới đều, bón lân kali khi ra hoa." },
      {
        title: "Thu hoạch",
        text: "Hái quả xanh hoặc chín đỏ/vàng sau 80-90 ngày.",
      },
    ],
    status: "published",
  },

  // === CÂY GIA VỊ (HERB) ===
  {
    title: "Trồng Húng quế trong chậu nhỏ",
    plant_name: "Húng quế",
    plant_group: "herb",
    description: "Húng quế thơm, dễ trồng, khai thác liên tục.",
    content: "<p>Húng quế ưa nắng, tưới vừa phải.</p>",
    plantTags: ["Gia vị", "Thơm", "Dễ trồng"],
    steps: [
      { title: "Gieo hạt", text: "Gieo hạt vào chậu nhỏ 10-15cm." },
      { title: "Chăm sóc", text: "Đặt nơi nhiều nắng, tưới khi đất khô." },
      { title: "Thu hoạch", text: "Cắt ngọn khi cây cao 20cm." },
    ],
    status: "published",
  },
  {
    title: "Cách trồng Hành lá tại nhà",
    plant_name: "Hành lá",
    plant_group: "herb",
    description: "Hành lá trồng từ củ, tái sinh nhanh.",
    content: "<p>Hành lá có thể trồng trong nước hoặc đất.</p>",
    plantTags: ["Gia vị", "Tái sinh", "Siêu dễ"],
    steps: [
      {
        title: "Chuẩn bị",
        text: "Lấy củ hành còn rễ, cắm vào ly nước hoặc chậu.",
      },
      { title: "Chăm sóc", text: "Đổi nước 2-3 ngày/lần." },
      { title: "Thu hoạch", text: "Cắt lá sau 10-15 ngày." },
    ],
    status: "published",
  },
];

async function run() {
  await connectDB();
  console.log("✅ Connected to MongoDB");

  // Tìm expert user để làm author
  let expertUser = await User.findOne({ role: "expert" });
  if (!expertUser) {
    console.log("⚠️ No expert user found, using admin or creating demo expert");
    expertUser = await User.findOne({ role: "admin" });
  }

  if (!expertUser) {
    console.log("❌ No suitable user found. Please create expert user first.");
    process.exit(1);
  }

  console.log(`📝 Using user: ${expertUser.username} (${expertUser.role})`);

  // Xóa guides cũ (tùy chọn)
  const deleteCount = await Guide.deleteMany({});
  console.log(`🗑️  Deleted ${deleteCount.deletedCount} existing guides`);

  // Tạo guides mới
  for (const sample of samples) {
    try {
      const guide = await Guide.create({
        ...sample,
        expert_id: expertUser._id,
      });
      console.log(`✅ Created: ${guide.plant_name} (${guide.plant_group})`);
    } catch (e) {
      console.error(`❌ Failed to create ${sample.plant_name}:`, e.message);
    }
  }

  console.log("\n📊 Summary:");
  const countByGroup = await Guide.aggregate([
    { $match: { deleted: false } },
    { $group: { _id: "$plant_group", count: { $sum: 1 } } },
  ]);

  console.table(countByGroup);

  console.log("\n✅ Seed guides completed!");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
