#!/usr/bin/env node
import 'dotenv/config';
import { connectDB } from '../config/db.js';
import Guide from '../models/Guide.js';

const PLANT_GROUP = 'herb';

const MAPPING = {
  'Húng quế': [
    { title: 'Chuẩn bị đất', text: 'Dùng đất tơi xốp, thoát nước tốt, bổ sung phân hữu cơ hoai mục (2–3 cm) và trộn nhẹ với cát nếu đất nặng.' },
    { title: 'Gieo/nhân giống', text: 'Gieo hạt mỏng lên bề mặt đất, phủ một lớp đất mỏng ~0.5 cm; giữ ẩm, nảy mầm trong 7–10 ngày. Có thể giâm cành cho nhân nhanh.' },
    { title: 'Ánh sáng & vị trí', text: 'Đặt chậu nơi có nắng 4–6 giờ/ngày; trời quá nóng che nắng buổi trưa.' },
    { title: 'Tưới & dinh dưỡng', text: 'Tưới giữ ẩm đều (không ngập úng). Bón thúc phân lỏng cân bằng NPK loãng 2–3 tuần/lần hoặc phân hữu cơ loãng.' },
    { title: 'Cắt tỉa & phòng bệnh', text: 'Thường xuyên ngắt ngọn để kích thích phát nhánh; kiểm tra sâu lá (rệp, nhện) và xử lý bằng xịt nước, xà phòng sinh học hoặc chế phẩm hữu cơ.' },
    { title: 'Thu hoạch & bảo quản', text: 'Thu lá khi cây đạt 15–20 cm, hái từ trên xuống; dùng tươi hoặc phơi khô/đông lạnh để bảo quản.' }
  ],

  'Húng lủi': [
    { title: 'Chuẩn bị đất', text: 'Đất tơi, giàu mùn, giữ ẩm tốt nhưng thoát nước. Chậu tốt nên có lỗ thoát.' },
    { title: 'Nhân giống', text: 'Giâm cành (10–15 cm) vào giá thể ẩm; rễ xuất hiện sau 1–2 tuần. Trồng cách nhau ~20–30 cm nếu luống.' },
    { title: 'Ánh sáng & nhiệt', text: 'Cần nắng nhẹ – bán che sáng cũng tốt; tránh nắng gắt buổi trưa.' },
    { title: 'Tưới & bón', text: 'Tưới đều để đất luôn hơi ẩm; bón phân hữu cơ 1 tháng/lần. Mint sinh trưởng mạnh nên cần phân đều.' },
    { title: 'Kiểm soát phát triển', text: 'Mint lan rất nhanh; trồng trong chậu để kiểm soát. Cắt tỉa định kỳ để cây dày, không vươn dây.' },
    { title: 'Thu hoạch', text: 'Cắt ngọn khi cây cao ~10–15 cm; thu nhiều lần, dùng tươi hoặc làm lá khô.' }
  ],

  'Ngò rí': [
    { title: 'Chuẩn bị đất', text: 'Đất pha cát, mềm, giàu hữu cơ, pH trung tính. Làm luống cao 10–15 cm để thoát nước.' },
    { title: 'Gieo hạt', text: 'Gieo rải mỏng, phủ nhẹ lớp đất mỏng, giữ ẩm; nảy mầm 7–14 ngày. Gieo xen kẽ để thu hoạch liên tục.' },
    { title: 'Vị trí & ánh sáng', text: 'Cần nắng sáng 3–5 giờ/ngày; trời nóng cây dễ ra hoa sớm.' },
    { title: 'Tưới & chăm sóc', text: 'Tưới đều, tránh khô hạn; bón ít phân N để lá xanh mượt, không bón quá nhiều sẽ làm cây ra hoa nhanh.' },
    { title: 'Phòng bệnh & sâu', text: 'Thường ít sâu; kiểm tra rệp, bệnh héo lá. Dọn lá vàng để giảm bệnh.' },
    { title: 'Thu hoạch', text: 'Cắt lá khi cây cao ~10–15 cm; hái từng nắm để lá tiếp tục mọc lại.' }
  ],

  'Ngò gai': [
    { title: 'Chuẩn bị đất', text: 'Giàu mùn, ẩm nhưng thoát nước; bón lót phân hữu cơ trước khi trồng.' },
    { title: 'Nhân giống', text: 'Gieo hạt nông hoặc tách bụi; giữ ẩm nhẹ, nảy mầm trong 10–14 ngày.' },
    { title: 'Vị trí', text: 'Ưa bóng râm nhẹ — tránh nắng gắt. Trồng dưới tán cây hoặc nơi che sáng.' },
    { title: 'Tưới & bón', text: 'Đảm bảo ẩm đều; bón phân hữu cơ nhẹ 4–6 tuần/lần.' },
    { title: 'Chăm sóc & bệnh', text: 'Loại bỏ lá úa, giữ khoảng cách để thông thoáng; kiểm tra rệp và nấm mốc.' },
    { title: 'Thu hoạch', text: 'Cắt từng lá hoặc tỉa sát gốc để kích thích lá non; thu vài lần trong mùa.' }
  ],

  'Rau răm': [
    { title: 'Chuẩn bị giá thể', text: 'Đất tơi xốp, giàu dinh dưỡng; chậu/luống có thoát nước.' },
    { title: 'Nhân giống', text: 'Giâm cành 8–12 cm vào đất ẩm; rễ nhanh sau vài ngày. Trồng dày vừa phải (~20–25 cm).' },
    { title: 'Ánh sáng', text: 'Thích bán sáng đến râm; tránh nắng gắt buổi trưa.' },
    { title: 'Tưới & dinh dưỡng', text: 'Tưới đều, giữ ẩm; bón phân hữu cơ định kỳ để cây đậm lá.' },
    { title: 'Kiểm soát sâu bệnh', text: 'Thường ít sâu; loại bỏ cây yếu, kiểm tra nấm mốc ở gốc.' },
    { title: 'Thu hoạch & sử dụng', text: 'Cắt ngọn theo nhu cầu, lá dùng tươi; thu liên tục để kích thích ra nhiều cành non.' }
  ],

  'Sả': [
    { title: 'Chuẩn bị đất', text: 'Đất tơi, nhiều mùn, thoát nước; bón lót phân hữu cơ hoặc tro trấu.' },
    { title: 'Nhân giống', text: 'Trồng bằng các khúc rễ/khúc thân có mắt; chôn ngang 2–3 cm hoặc trồng hom rễ.' },
    { title: 'Ánh sáng & vị trí', text: 'Cần nắng đầy đủ (6+ giờ/ngày); trồng nơi có khoảng không gian vì cây lớn.' },
    { title: 'Tưới & bón', text: 'Tưới đều, giữ ẩm nhưng tránh ngập. Bón phân hữu cơ 1–2 tháng/lần khi cây phát triển.' },
    { title: 'Chăm sóc', text: 'Loại bỏ cỏ dại quanh gốc, che gốc khi trời lạnh; cắt tỉa lá già.' },
    { title: 'Thu hoạch & bảo quản', text: 'Cắt thân khi mọc thành bụi lớn; có thể để tươi hoặc sấy/đông lạnh để dùng dần.' }
  ]
};

async function main() {
  await connectDB();
  const plants = Object.keys(MAPPING);
  let created = 0;
  let updated = 0;

  for (const plant of plants) {
    const steps = MAPPING[plant];
    const title = `Hướng dẫn trồng ${plant}`;

    try {
      const existing = await Guide.findOne({ plant_group: PLANT_GROUP, plant_name: plant });
      if (existing) {
        existing.title = title;
        existing.steps = steps;
        existing.plantTags = Array.from(new Set([...(existing.plantTags || []), plant]));
        existing.status = existing.status || 'published';
        await existing.save();
        updated++;
        console.log(`Updated guide for: ${plant}`);
      } else {
        const g = new Guide({
          expert_id: null,
          title,
          description: `Hướng dẫn cơ bản để trồng ${plant}`,
          content: `<p>Hướng dẫn cơ bản để trồng ${plant}.</p>`,
          steps,
          plant_group: PLANT_GROUP,
          plant_name: plant,
          plantTags: [plant],
          status: 'published'
        });
        await g.save();
        created++;
        console.log(`Created guide for: ${plant}`);
      }
    } catch (e) {
      console.error('Error processing', plant, e);
    }
  }

  console.log(`Done. Created: ${created}, Updated: ${updated}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
