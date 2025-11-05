import 'dotenv/config';
import { connectDB } from '../config/db.js';
import Guide from '../models/Guide.js';

// Simple seeding script to create sample guides with steps and plantTags
// Run: node backend/scripts/seedGuides.js

const samples = [
  {
    title: 'Trồng rau mầm trong chung cư (dễ chăm)',
    description: 'Hướng dẫn nhanh trồng rau mầm trong khay, phù hợp cho người bận rộn.',
    content: '<p>Trồng rau mầm rất nhanh và phù hợp cho ban công chung cư nhỏ.</p>',
    image: 'guides/placeholder.png',
    plantTags: ['Rau củ dễ chăm', 'Trồng trong chung cư', 'Ít thời gian chăm sóc'],
    steps: [
      { title: 'Chuẩn bị', text: 'Chuẩn bị hạt giống, khay, giá thể (đất hoặc mút).', image: 'guides/placeholder.png' },
      { title: 'Gieo', text: 'Ngâm hạt, gieo đều lên khay và phủ lớp mỏng đất.', image: 'guides/placeholder.png' },
      { title: 'Tưới và chờ', text: 'Tưới đủ ẩm, đặt nơi có ánh sáng gián tiếp và chờ 5-7 ngày để thu hoạch.', image: 'guides/placeholder.png' }
    ]
  },
  {
    title: 'Trồng ổi chậu (trái cây ngắn hạn)',
    description: 'Gợi ý trồng ổi trong chậu, phù hợp ban công với ít không gian.',
    content: '<p>Ổi là loại cây có thể thu quả trong thời gian ngắn nếu chăm sóc đúng.</p>',
    image: 'guides/placeholder.png',
    plantTags: ['Trái cây ngắn hạn', 'Trồng trong chung cư'],
    steps: [
      { title: 'Chọn giống', text: 'Chọn giống ổi năng suất cao, mua cây con hoặc chiết cành.', image: 'guides/placeholder.png' },
      { title: 'Trồng vào chậu', text: 'Dùng chậu lớn, hỗn hợp đất tơi xốp, bón lót phân hữu cơ.', image: 'guides/placeholder.png' },
      { title: 'Chăm sóc', text: 'Tưới, tỉa cành, bón phân định kỳ để ra hoa và kết trái.', image: 'guides/placeholder.png' }
    ]
  },
  {
    title: 'Trồng rau gia vị trên lan can',
    description: 'Các loại rau gia vị dễ trồng, khai thác hàng ngày.',
    content: '<p>Rau gia vị như húng, hành lá phù hợp cho người bận rộn.</p>',
    image: 'guides/placeholder.png',
    plantTags: ['Cây gia vị', 'Trồng trong chung cư', 'Ít thời gian chăm sóc'],
    steps: [
      { title: 'Chuẩn bị chậu nhỏ', text: 'Chọn chậu 15-20cm, đất trộn phân vi sinh.', image: 'guides/placeholder.png' },
      { title: 'Gieo hoặc ghép', text: 'Gieo hạt hoặc ghép thanh giống, đặt nơi có nắng sáng.', image: 'guides/placeholder.png' },
      { title: 'Thu hoạch', text: 'Thu hoạch từng lá theo nhu cầu, cây sẽ tiếp tục phát triển.', image: 'guides/placeholder.png' }
    ]
  }
];

async function run(){
  await connectDB();
  console.log('Connected. Seeding guides...');
  for(const s of samples){
    try{
      const g = await Guide.create(s);
      console.log('Created guide', g._id.toString(), g.title);
    }catch(e){
      console.error('Failed to create sample:', e.message);
    }
  }
  console.log('Done.');
  process.exit(0);
}

run().catch(err=>{ console.error(err); process.exit(1); });
