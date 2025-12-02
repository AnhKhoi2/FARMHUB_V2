#!/usr/bin/env node
import 'dotenv/config';
import { connectDB } from '../config/db.js';
import Guide from '../models/Guide.js';

const PLANT_GROUP = 'fruit_long_term';

const MAPPING = {
  'Chanh': [
    { title: 'Chuẩn bị đất và vị trí', text: 'Chọn khu vực trồng có ít nhất 6 tiếng nắng mỗi ngày; đất phải tơi xốp, giàu mùn và thoát nước tốt. Đào hố sâu hơn bầu rễ khoảng 10–15 cm, trộn 20–30% phân hữu cơ ủ hoai với đất mặt để cải thiện cấu trúc và dinh dưỡng ban đầu.' },
    { title: 'Chọn giống & xử lý giống', text: 'Ưu tiên cây ghép từ vườn giống uy tín, không chọn cây có dấu hiệu sâu bệnh. Trước khi trồng, kiểm tra và cắt bỏ rễ hư, khử trùng bầu bằng dung dịch nhẹ nếu cần và ngâm bầu trong nước 30 phút để đất bám đều.' },
    { title: 'Trồng/ghép & quản lý sau trồng', text: 'Đặt bầu cây sao cho cổ rễ ngang bằng mặt đất, lấp đất và nén nhẹ, tưới đẫm để lấp đầy khoảng không. Buộc cây vào cọc hỗ trợ trong 4–8 tuần; che nắng trong những ngày nắng nóng gay gắt để giảm sốc.' },
    { title: 'Bón lót & lịch bón', text: 'Bón lót hữu cơ (phân chuồng ủ hoai hoặc compost) trước khi trồng; sau 1–2 tháng, bắt đầu bón theo giai đoạn: cây con bón nhiều đạm để phát triển, cây trưởng thành bón cân đối N-P-K và tăng kali khi chuẩn bị ra hoa để hỗ trợ đậu quả.' },
    { title: 'Tưới tiêu & quản lý nước', text: 'Tưới sâu và ít lần hơn tưới nông; áp dụng tưới nhỏ giọt để giữ ẩm đều quanh rễ và tiết kiệm nước. Tránh để vùng gốc bị ngập nước — nếu đất giữ nước kém, làm rãnh thoát hoặc nâng luống trồng.' },
    { title: 'Cắt tỉa & quản lý tán', text: 'Tỉa bỏ cành bệnh, cành vượt chéo để tạo tán mở, giúp thông gió và giảm bệnh nấm. Thực hiện tỉa định kỳ sau mỗi mùa thu hoạch và loại bỏ quả chớm bị bệnh để tập trung dinh dưỡng cho trái chất lượng.' }
  ],

  'Tắc': [
    { title: 'Chuẩn bị đất', text: 'Chuẩn bị luống cao hoặc gò đất để tránh úng, làm tơi lớp đất mặt và bổ sung phân hữu cơ (10–20 kg/ hố tùy kích thước). Kiểm tra pH và điều chỉnh về khoảng 6.0–7.0 nếu cần bằng vôi hoặc lưu huỳnh.' },
    { title: 'Chọn giống & ươm', text: 'Chọn cây ghép khỏe, không có vết bệnh; ươm cây con trong khay hoặc bầu riêng đến khi có hệ rễ ổn định và 4–6 lá thật. Tránh ươm quá lâu khiến cây bị kiệt sức.' },
    { title: 'Trồng & cắm cọc', text: 'Trồng đúng độ sâu bầu, lấp đất vừa đủ, nén nhẹ và tưới đẫm; cắm cọc và buộc gốc mềm để chống đổ khi gặp gió mạnh. Đặt cách nhau hợp lý để cây phát triển tán.' },
    { title: 'Bón phân', text: 'Bón lót phân hữu cơ trước khi trồng; chu kỳ bón phân cho cây trưởng thành chia làm 3–4 lần/năm, tăng N cho giai đoạn sinh trưởng và tăng K khi cây chuẩn bị ra hoa/đậu trái. Bổ sung vi lượng (Zn, B) nếu có triệu chứng thiếu.' },
    { title: 'Tưới & thoát nước', text: 'Ưu tiên tưới nhỏ giọt để duy trì độ ẩm đều quanh rễ; giảm tưới khi đất còn ẩm để tránh thối rễ. Đảm bảo hệ thống thoát nước hoạt động tốt trong mùa mưa.' },
    { title: 'Cắt tỉa & kích trái', text: 'Thực hiện tỉa tạo tán nhẹ để lấy ánh sáng và thông gió; với cây quá sai quả, tiến hành loại bớt quả non để tập trung dinh dưỡng cho quả còn lại giúp tăng kích thước và chất lượng.' }
  ],

  'Dâu tây': [
    { title: 'Chuẩn bị đất/giá thể', text: 'Sử dụng giá thể thoát nước tốt, giàu mùn, có thể trộn xơ dừa với phân hữu cơ và tro trấu; đặt hệ thống thoát để tránh ngập úng. Phủ rơm hoặc màng nông nghiệp để giữ ẩm và giảm cỏ dại.' },
    { title: 'Chọn giống & ươm', text: 'Chọn giống phù hợp vùng (chịu nhiệt hoặc chịu lạnh tùy khu vực); ươm đến khi cây có 3–4 lá thật, kiểm soát sâu bệnh ở giai đoạn ươm để tránh lây lan khi trồng ra.' },
    { title: 'Trồng & khoảng cách', text: 'Đặt cây cách 20–30 cm để vườn vừa thoáng khí vừa tối ưu năng suất; không chôn sâu cuống lá để tránh mục cổ rễ, lấp đất sao cho mắt lá hơi nổi trên mặt giá thể.' },
    { title: 'Bón phân theo giai đoạn', text: 'Giai đoạn cây con ưu tiên đạm để phát triển lá và rễ; khi cây bắt đầu ra hoa và kết trái giảm đạm, tăng P và K để hỗ trợ ra hoa và làm ngọt trái. Theo dõi EC của giá thể nếu trồng trong chậu để tránh quá mặn.' },
    { title: 'Tưới & quản lý ẩm', text: 'Tưới sáng và tránh tưới ban đêm để giảm nguy cơ nấm; dùng tưới nhỏ giọt hoặc phun sương nhẹ để giữ ẩm mặt giá thể đều. Giữ ẩm ổn định, không để khô gián đoạn gây rụng hoa và trái.' },
    { title: 'Vệ sinh & thu hoạch', text: 'Loại bỏ cây, lá bị bệnh ngay và tiêu hủy; thu hoạch trái bằng tay nhẹ nhàng khi đạt màu và kích thước tiêu chuẩn, tránh làm bầm trái để giữ chất lượng bảo quản.' }
  ],

  'Nho': [
    { title: 'Chuẩn bị đất & giàn', text: 'Chọn đất thoát nước tốt, giàu mùn; dựng giàn hoặc khung vững trước khi trồng để tiện việc dẫn kéo cành. Chuẩn bị hệ thống tưới nhỏ giọt trước khi trồng.' },
    { title: 'Chọn hom/giống', text: 'Chọn hom hoặc giống khỏe, không có vết bệnh; xử lý hom bằng thuốc sát trùng nhẹ và để khô vết cắt trước khi trồng để hạn chế thối.' },
    { title: 'Trồng & khoảng cách', text: 'Đặt hàng cách hàng 1.5–3 m tuỳ giống và mục đích (bán tươi hay làm rượu); lỗ trồng phải cao ráo và có lớp mùn phủ để giữ ẩm ban đầu.' },
    { title: 'Bón phân & lịch chăm sóc', text: 'Bón phân hữu cơ khi lập vườn; trong thời kỳ ra hoa và làm ngọt trái cần điều chỉnh giảm đạm và tăng kali, theo dõi lá để bổ sung vi lượng như Mg/Fe nếu thấy thiếu.' },
    { title: 'Tưới & quản lý nước', text: 'Tưới có kiểm soát, ưu tiên tưới sâu ngắn ngày hơn tưới nông thường xuyên; tăng nhẹ lượng nước trong giai đoạn nảy chồi và ra quả, giảm trước thu hoạch để tăng độ ngọt.' },
    { title: 'Cắt tỉa & quản lý chùm', text: 'Cắt tỉa tạo bộ khung, loại cành già, cành yếu; tỉa lá xung quanh chùm để tăng ánh sáng và lưu thông không khí, giảm bệnh và giúp chùm chín đều.' }
  ],

  'Thanh long': [
    { title: 'Chuẩn bị đất & trụ', text: 'Chọn đất nhẹ, thoát nước; làm trụ bê tông hoặc cọc gỗ vững chắc và bọc bảo vệ chân trụ. Bón lót phân hữu cơ vào hố trước khi trồng để cung cấp dinh dưỡng nền.' },
    { title: 'Chọn hom & xử lý', text: 'Chọn hom khỏe, không bị thối; xử lý vết cắt bằng thuốc sát trùng/than hoạt tính nếu cần để tránh nấm xâm nhập.' },
    { title: 'Trồng & cố định', text: 'Gắn thân thanh long chắc lên trụ, dùng dây mềm cố định từng đoạn để tránh tổn thương vỏ; đảm bảo khoảng cách giữa thân để cây có không gian quấn.' },
    { title: 'Bón phân & thời điểm', text: 'Giai đoạn sinh trưởng tăng lượng N để phát triển thân, khi bắt đầu xuất nụ và ra hoa tăng lượng K để hỗ trợ đậu trái; bón phân theo hàng tháng hoặc theo khuyến nghị chuyên môn.' },
    { title: 'Tưới & thoát nước', text: 'Tưới sâu khi đất khô; kiểm tra độ ẩm lớp cận bề mặt để tránh tưới quá nhiều dẫn đến thối rễ. Trong mùa mưa, kiểm soát nước quanh gốc để tránh ngập úng.' },
    { title: 'Cắt tỉa & phòng bệnh', text: 'Thường xuyên loại bỏ phần thân già bệnh, vệ sinh dụng cụ cắt; ưu tiên biện pháp sinh học (bẫy bã trứng, vi sinh) trước khi dùng thuốc hoá học.' }
  ],

  'Ổi': [
    { title: 'Chuẩn bị đất', text: 'Chọn đất thoát nước, tăng mùn bằng phân chuồng ủ hoai hoặc compost; kiểm tra pH và bổ sung vôi nếu quá chua. Lấp hố trồng trước vài ngày để đất ổn định.' },
    { title: 'Chọn giống & ươm', text: 'Dùng giống bản địa hoặc cây ghép kháng bệnh để giảm rủi ro dịch hại; ươm cây trong bầu đủ rễ, tránh để bầu khô hoặc ngập.' },
    { title: 'Trồng & khoảng cách', text: 'Đặt khoảng cách 4–6 m giữa các cây tuỳ vào kiểu vườn; sau khi trồng tưới đẫm để cây đứng vững và giảm sốc.' },
    { title: 'Bón phân', text: 'Bón hữu cơ hàng năm để duy trì độ mùn, chia bón phân đại trà theo giai đoạn sinh trưởng: trẻ cần N, giai đoạn ra hoa và nuôi quả cần tăng K và P.' },
    { title: 'Tưới & quản lý ẩm', text: 'Tưới đều, giữ ẩm nhưng không để gốc bị úng; tăng tưới vào mùa khô và giảm vào mùa mưa để tránh thối rễ.' },
    { title: 'Cắt tỉa & phòng bệnh', text: 'Tỉa tạo tán thông thoáng, loại bỏ cành già bệnh; kiểm soát sâu bệnh bằng vệ sinh vườn, bẫy và sử dụng thuốc sinh học khi cần.' }
  ],

  'Táo': [
    { title: 'Chuẩn bị đất & điều kiện khí hậu', text: 'Táo ưa đất sâu, thoát nước và khí hậu mát mẻ; chọn vị trí có sương lạnh nhẹ nếu phù hợp giống. Cải tạo đất bằng phân hữu cơ và cát nhẹ nếu đất quá nặng.' },
    { title: 'Chọn giống & ghép', text: 'Chọn giống ghép phù hợp vùng (gốc chịu đất và hạn/ẩm), ưu tiên giống kháng bệnh. Kiểm tra gốc ghép trước khi trồng để đảm bảo liên kết khỏe.' },
    { title: 'Trồng & định vị', text: 'Khoảng cách trồng 3–5 m tuỳ giống; chú trọng tạo rãnh thoát nước quanh hàng để tránh úng vào mùa mưa. Định vị cây thẳng, nén đất nhẹ và tưới đẫm.' },
    { title: 'Bón phân & vi lượng', text: 'Bón phân hữu cơ đều hàng năm; bổ sung Ca và B để giảm hiện tượng rụng hoa/ rụng trái non và cải thiện chất lượng vỏ trái. Theo dõi thiếu vi lượng và bón bổ sung theo liều khuyến cáo.' },
    { title: 'Tưới & quản lý mùa khô', text: 'Tưới sâu, đều một lần/tuần tuỳ điều kiện; tránh tưới nhỏ giọt liên tục làm yếu rễ. Trong mùa khô, tăng cường tưới để duy trì năng suất.' },
    { title: 'Cắt tỉa & xử lý quả', text: 'Tỉa tạo tán mở để ánh sáng và không khí vào, loại bỏ cành tăm mảnh; thực hiện xử lý quả thừa và bấm ngọn để tập trung dinh dưỡng giúp quả đạt kích thước và màu sắc mong muốn.' }
  ],

  'Chuối mini': [
    { title: 'Chuẩn bị đất & hố trồng', text: 'Chuẩn bị hố lớn, bón phân chuồng ủ hoai hoặc compost vào hố để tăng dinh dưỡng nền; chọn đất giàu mùn, thoát nước tốt. Nếu trồng trên mô, lưu ý làm rãnh thoát nước.' },
    { title: 'Chọn cây con & xử lý', text: 'Chọn mầm khỏe, không bị sâu bệnh; xử lý bầu và loại bỏ phần rễ thối, tránh trồng khi đất quá ướt để giảm nguy cơ thối.' },
    { title: 'Trồng & khoảng cách', text: 'Khoảng cách 1–2 m giữa cây tuỳ kích thước giống; trồng sao cho cổ rễ ngang bằng mặt đất, lấp đất và tưới đẫm để cây đứng vững.' },
    { title: 'Bón phân & tỉa chồi', text: 'Bón phân định kỳ (3–4 lần/năm) kết hợp phân hữu cơ và vô cơ; loại bỏ chồi, đọt không cần thiết để tập dinh dưỡng cho cây chính giúp tăng năng suất và kích thước buồng.' },
    { title: 'Tưới & thoát nước', text: 'Chuối cần nhiều nước nhưng không chịu úng; tưới đều, tăng lượng vào giai đoạn tạo buồng và giảm khi trời lạnh. Đảm bảo rãnh thoát để tránh ngập úng vào mùa mưa.' },
    { title: 'Vệ sinh & thu hoạch', text: 'Thường xuyên loại bỏ lá bệnh, tập trung vệ sinh vườn để giảm nguồn bệnh; thu hoạch nhẹ nhàng khi buồng đạt độ chín mong muốn, xử lý sơ chế nhanh để tránh thâm đen.' }
  ],

  'Đu đủ': [
    { title: 'Chuẩn bị đất', text: 'Chọn đất sâu, thoát nước và giàu hữu cơ; làm luống cao nếu vùng có mưa nhiều để tránh úng. Bón lót phân chuồng ủ hoai hoặc phân compost trước trồng.' },
    { title: 'Chọn giống & ươm', text: 'Chọn giống theo mục tiêu (ăn tươi, chế biến), ươm trong bầu cho tới khi bộ rễ phát triển tốt; tránh để cây con bị sốc khi chuyển chậu.' },
    { title: 'Trồng & chăm gốc', text: 'Trồng thẳng, không chôn quá sâu cổ rễ; cắm cọc nhỏ nếu vùng gió mạnh để giữ cây non thẳng. Tưới ngay sau trồng để cố định bầu và giúp cây hồi phục.' },
    { title: 'Bón phân & kali', text: 'Bón phân hữu cơ định kỳ, kết hợp bón kali trong giai đoạn trái phát triển để tăng kích thước và độ ngọt. Bổ sung vi lượng khi thấy triệu chứng thiếu để duy trì sức khỏe cây.' },
    { title: 'Tưới & quản lý nước', text: 'Tưới đều, giữ ẩm cho cây nhưng tránh úng; điều chỉnh lượng nước theo giai đoạn sinh trưởng, nhiều hơn khi trái đang lớn.' },
    { title: 'Chăm sóc & thu hoạch', text: 'Kiểm tra sâu bệnh định kỳ, loại bỏ cây yếu; thu hoạch khi trái đạt màu và độ mềm mong muốn, bảo quản nơi mát để giảm hỏng.' }
  ],

  'Việt quất': [
    { title: 'Chuẩn bị đất & pH', text: 'Việt quất cần đất chua, pH 4.5–5.5; bổ sung than bùn hoặc vỏ cây mục để tạo môi trường ưa thích và giữ ẩm tốt. Đảm bảo lớp đất trên cùng thoát nước và giàu mùn.' },
    { title: 'Chọn giống & ươm', text: 'Chọn giống phù hợp vùng (khả năng chịu rét/khô khác nhau), ươm giữ ẩm đều và tránh sốc nhiệt. Tránh trồng vào thời điểm quá nóng để cây con không bị stress.' },
    { title: 'Trồng & phủ gốc', text: 'Phủ mùn dày (vỏ cây, mùn) để giữ ẩm và giảm cỏ dại; đảm bảo đường kính phủ mùn không chạm trực tiếp vào thân cây để tránh thối. Khoảng cách trồng khoảng 1–1.5 m tùy giống.' },
    { title: 'Bón phân chuyên cho quả mọng', text: 'Sử dụng phân chuyên cho quả mọng, cân đối N-P-K, không bón quá nhiều đạm vào giai đoạn chín để tránh giảm chất lượng. Theo dõi và bổ sung vi lượng đặc thù nếu cần.' },
    { title: 'Tưới & giữ ẩm', text: 'Giữ ẩm ổn định quanh năm, đặc biệt trong giai đoạn ra hoa và kết trái; tưới nhỏ giọt là lý tưởng để kiểm soát ẩm độ và tránh ẩm bề mặt gây nấm.' },
    { title: 'Cắt tỉa & bảo vệ trái', text: 'Cắt tỉa cành già và dọn dẹp tán để tăng lưu thông không khí; sử dụng lưới che để bảo vệ trái khỏi chim và sâu, thu hoạch khi trái chín đều để đạt hương vị tốt nhất.' }
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
  }

  console.log(`Done. Created: ${created}, Updated: ${updated}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
