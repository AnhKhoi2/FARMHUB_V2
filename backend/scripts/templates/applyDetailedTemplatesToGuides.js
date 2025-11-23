import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectDB } from "../config/db.js";
import Guide from "../models/Guide.js";
import User from "../models/User.js";

/**
 * Apply detailed templates to guides based on plant_group.
 * - Backup existing guides to `backend/scripts/backup_guides_before_apply_<ts>.json`
 * - Overwrite: title, plant_name, description, content, steps, plantTags, tags, status: 'published'
 * Templates include VietGAP-alike sections (an toàn thực phẩm, quản lý nước, IPM, bón phân...)
 * Usage: node backend/scripts/applyDetailedTemplatesToGuides.js
 */

const templates = {
  fruit_short_term: {
    label: "Cây ăn quả ngắn hạn",
    plants: ["Dưa leo", "Cà chua bi", "Dâu tây", "Ớt chuông", "Mướp"],
    plantTags: ["Cây ăn quả ngắn hạn", "Leo giàn", "Ban công", "Chậu lớn"],
    tagsBase: ["VietGAP:An toàn thực phẩm", "VietGAP:Quản lý dịch bệnh", "Ban công"]
  },
  leaf_vegetable: {
    label: "Rau ăn lá",
    plants: ["Xà lách", "Rau muống", "Cải xanh", "Rau thơm hỗn hợp", "Rau mầm"],
    plantTags: ["Rau ăn lá", "Thu hoạch nhanh", "Ban công", "Chậu nông"],
    tagsBase: ["VietGAP:An toàn thực phẩm", "VietGAP:Quản lý phân bón", "Ban công"]
  },
  root_vegetable: {
    label: "Rau củ (cây củ)",
    plants: ["Cà rốt baby", "Củ cải trắng", "Củ hành nhỏ", "Củ cải đỏ", "Khoai tây mini"],
    plantTags: ["Rau củ", "Chậu sâu", "Ban công"],
    tagsBase: ["VietGAP:An toàn thực phẩm", "VietGAP:Quản lý nước", "Chậu sâu"]
  },
  herb: {
    label: "Gia vị/Thảo mộc",
    plants: ["Húng quế", "Hành lá", "Ngò rí", "Sả", "Hương thảo"],
    plantTags: ["Gia vị", "Chậu nhỏ", "Tái sinh"],
    tagsBase: ["VietGAP:An toàn thực phẩm", "VietGAP:Không dùng thuốc cấm", "Chậu nhỏ"]
  },
  other: {
    label: "Cây ban công / sân thượng",
    plants: ["Dâu tây", "Ổi lùn", "Chanh dây nhỏ", "Lê cảnh nhỏ", "Cây hoa ăn được"],
    plantTags: ["Sân thượng", "Ban công", "Chậu treo"],
    tagsBase: ["VietGAP:An toàn thực phẩm", "VietGAP:Quản lý môi trường", "Ban công"]
  }
};

function makeVietGAPSteps(plantName) {
  return [
    { title: "Tiền trồng (Chuẩn bị)", text: `Chọn giống/giống cây khỏe cho ${plantName}. Chuẩn bị chậu/luống, giá thể sạch, phân hữu cơ đã hoai mục; kiểm tra pH và tính thoát nước. Ghi lại lô giống, ngày nhận và nhà cung cấp để truy xuất nguồn gốc.` },
    { title: "Gieo / Trồng", text: `Gieo hạt hoặc trồng cây con đúng mật độ, chiều sâu và cự ly được khuyến nghị cho ${plantName}. Ghi nhật ký ngày gieo/trồng, số lượng cây và nguồn cây giống theo mẫu VietGAP.` },
    { title: "Chăm sóc & Dinh dưỡng (Lịch bón)", text: `Thiết lập lịch tưới và bón phân: nêu khung thời gian (ví dụ: bón lót trước trồng, bón thúc khi phân hóa mầm hoa và khi tạo quả). Ưu tiên phân hữu cơ và phân cân đối N-P-K; ghi sổ nhật ký bón phân (ngày, loại phân, liều lượng, phương pháp bón).` },
    { title: "Quản lý dịch hại (IPM)", text: `Thực hiện IPM: kiểm tra cây định kỳ (ít nhất 1 lần/tuần), dùng bẫy dính/pheromone khi phù hợp, sử dụng chế phẩm sinh học (BT, neem, vi khuẩn đối kháng) trước khi cân nhắc thuốc hóa học. Nếu sử dụng thuốc, ghi rõ tên, nồng độ, liều và thời gian cách ly trước thu hoạch (PHI).` },
    { title: "Vệ sinh & an toàn lao động", text: `Đảm bảo dụng cụ sạch, vệ sinh chậu/giá thể, trang bị bảo hộ cho người thực hiện (găng tay, khẩu trang khi xử lý chế phẩm). Ghi chép ai thực hiện các thao tác quan trọng và thời gian.` },
    { title: "Thu hoạch & Hậu thu hoạch (Truy xuất nguồn gốc)", text: `Thu hái khi đạt tiêu chí chất lượng; rửa bằng nước sạch, để ráo; dán nhãn lô thu hoạch (ngày, thửa/chậu, người thu hoạch). Lưu hồ sơ để đảm bảo truy xuất nguồn gốc.` }
  ];
}

function makeVietGAPStepsCustomized(plantName, defaults = {}) {
  const pot = defaults.potSize || "tùy loại";
  const watering = defaults.watering || "theo điều kiện";
  return [
    { title: "Vật tư & dụng cụ", text: `Chuẩn bị chậu ${pot}, giá thể sạch và phân hữu cơ hoai mục; chuẩn bị dụng cụ cắt, giàn (nếu cần) và thiết bị tưới.` },
    { title: "Chuẩn bị giá thể", text: `Pha giá thể thoát nước tốt, giàu mùn; kiểm tra pH và độ thoát nước trước khi trồng ${plantName}.` },
    { title: "Gieo / Trồng", text: `Gieo hạt/ trồng cây con đúng mật độ và độ sâu khuyến nghị cho ${plantName}; ghi nhật ký lô giống và ngày gieo/trồng.` },
    { title: "Chăm sóc & Dinh dưỡng (Lịch bón)", text: `Thiết lập lịch tưới: ${watering}; bón phân theo giai đoạn sinh trưởng, ưu tiên phân hữu cơ; ghi chép đầy đủ.` },
    { title: "Quản lý dịch hại (IPM)", text: `Thực hiện IPM: kiểm tra định kỳ, dùng bẫy dính, chế phẩm sinh học; nếu cần dùng thuốc, tuân thủ PHI và ghi chép chi tiết.` },
    { title: "Thu hoạch & Hậu thu hoạch", text: `Thu hoạch khi đạt tiêu chuẩn chất lượng; xử lý hậu thu hoạch (rửa, phân loại, dán nhãn lô) để đảm bảo truy xuất nguồn gốc.` }
  ];
}

// Standard step templates for different planting contexts
const transplantFromPlugSteps = [
  { title: 'Tạo không gian cho rễ cây', text: 'Đào hố rộng gấp 3–4 lần bầu ươm; nếu chậu, chọn chậu lớn hơn bầu 3–4 lần để rễ phát triển.' },
  { title: 'Tháo bọc ươm cho cây', text: 'Tháo lớp bọc ngoài nhẹ nhàng, giữ nguyên bầu đất quanh rễ; tháo dây buộc cẩn thận, tránh kéo mạnh.' },
  { title: 'Gỡ rối rễ', text: 'Nếu rễ quấn hoặc rối, rạch đáy bầu hình chữ X và xòe nhẹ để rễ thoát ra; cẩn thận không làm đứt rễ chính.' },
  { title: 'Đặt cây vào giữa hố', text: 'Đặt bầu cây ở vị trí trung tâm, cổ rễ ngang bằng mặt đất; thêm đất dưới bầu nếu cần nâng cao.' },
  { title: 'Lấp đất & nén nhẹ', text: 'Lấp đất quanh bầu, nén nhẹ để loại bọt khí, không nén quá chặt để rễ vẫn thông thoáng.' },
  { title: 'Tạo vòng trũng tưới & phủ gốc', text: 'Tạo vòng trũng giữ nước quanh gốc, tưới đẫm sau khi trồng và phủ mùn rơm dày 6-12cm, cách thân ~5-10cm.' },
  { title: 'Tưới sau trồng', text: 'Tưới chậm và đều để đất lấp đầy khoảng trống; trong năm đầu tưoi thường xuyên, tránh tưới trực tiếp vào thân.' },
  { title: 'Bón phân nhẹ sau trồng', text: 'Không bón phân mạnh ngay sau trồng; sau 2-4 tuần khi cây ổn định có thể bón phân hữu cơ nhẹ.' }
];

const potPlantSteps = [
  { title: 'Chọn chậu & lỗ thoát', text: 'Chọn chậu có lỗ thoát; đặt lớp sỏi/lưới che lỗ để tránh trôi đất.' },
  { title: 'Chuẩn bị giá thể', text: 'Trộn giá thể tơi xốp: mùn dừa/đất sạch + phân hữu cơ + trấu/perlite để thoát nước và giữ ẩm.' },
  { title: 'Đặt đất nền & bầu', text: 'Đổ đất nền, đặt bầu lên, điều chỉnh độ cao sao cho cổ rễ ngang miệng chậu.' },
  { title: 'Lấp & cố định', text: 'Lấp đất xung quanh, ấn nhẹ để cố định; tránh nén quá chặt.' },
  { title: 'Tưới ban đầu', text: 'Tưới đều cho đất lún vừa đủ; kiểm tra thoát nước.' },
  { title: 'Bố trí nơi trồng', text: 'Đặt chậu nơi có ánh sáng phù hợp với loại cây (sáng đầy đủ cho cây ăn quả, ánh sáng vừa phải cho rau mầm).'},
  { title: 'Chăm sóc ban đầu', text: 'Theo dõi 1-2 tuần đầu: kiểm tra ẩm, dấu hiệu héo, sâu bệnh; che nắng nếu cần.' },
  { title: 'Bón & duy trì', text: 'Bón phân hữu cơ nhẹ sau 2-4 tuần; duy trì lịch tưới và theo dõi dinh dưỡng.' }
];

const seedSowingSteps = [
  { title: 'Ngâm & xử lý hạt', text: 'Ngâm hạt (nếu cần) theo loại; xử lý sát trùng nhẹ nếu khuyến nghị.' },
  { title: 'Chuẩn bị khay/chậu', text: 'Chuẩn bị khay hoặc chậu với giá thể sạch, rãi mỏng hạt và phủ 1-2mm đất.' },
  { title: 'Giữ ẩm & che bóng', text: 'Giữ ẩm đều; che bóng nếu trời quá nắng; đảm bảo thông gió để tránh nấm.' },
  { title: 'Tưới sương', text: 'Tưới nhẹ dạng sương 2-3 lần/ngày cho giai đoạn nảy mầm.' },
  { title: 'Chuyển sang chậu lớn/ghép', text: 'Khi cây con có 2-3 lá thật, ghép sang chậu lớn/hệ thống trồng chính.' },
  { title: 'Duy trì dinh dưỡng', text: 'Bón phân lỏng loãng khi cây con phát triển; tránh dư đạm.' },
  { title: 'Phòng bệnh', text: 'Theo dõi nấm mốc và bệnh hại; làm sạch khay và thay giá thể nếu cần.' },
  { title: 'Thu hoạch or ghép chuẩn bị', text: 'Thu hoạch lá non (rau mầm) hoặc chuẩn bị ghép/trồng khi đạt kích thước mong muốn.' }
];

const largeTreeSteps = [
  { title: 'Chuẩn bị vị trí & kiểm tra hạ tầng', text: 'Kiểm tra bản vẽ hạ tầng để tránh dây điện/ngầm; chọn vị trí đúng theo thiết kế.' },
  { title: 'Đào hố lớn', text: 'Đào hố rộng và sâu hơn nhiều so với bầu để tránh gốc bị bó rễ; xử lý đất đá nếu cần.' },
  { title: 'Vận chuyển & đặt bầu', text: 'Dùng cơ giới/xe cẩu cho cây lớn; đặt nhẹ nhàng vào giữa hố, đảm bảo cổ rễ ngang mặt đất.' },
  { title: 'Lấp & nén từng lớp', text: 'Lấp đất từng lớp, nén đều để tránh lỗ rỗng, kiểm tra độ đứng của cây.' },
  { title: 'Chống cây bằng cọc', text: 'Dùng 3-4 cọc chống theo hướng dẫn, buộc nhẹ để giữ thân thẳng nhưng không siết quá chặt.' },
  { title: 'Phủ gốc & tưới sâu', text: 'Phủ lớp mùn dày 6-12cm và tưới đẫm sau khi trồng; duy trì độ ẩm trong nhiều tuần.' },
  { title: 'Giám sát định kỳ', text: 'Theo dõi biểu hiện cây, rễ nhô, nghiêng, dấu hiệu bệnh; điều chỉnh chống cọc sau 3-6 tháng.' },
  { title: 'Bón lót lâu dài', text: 'Bổ sung phân hữu cơ định kỳ theo chu kỳ 3-6 tháng tùy loại cây lớn.' }
];

function getAdditionalStepTemplatesForGroup(groupKey) {
  const map = {
    fruit_short_term: [transplantFromPlugSteps],
    other: [transplantFromPlugSteps, largeTreeSteps],
    leaf_vegetable: [seedSowingSteps, potPlantSteps],
    root_vegetable: [seedSowingSteps],
    herb: [potPlantSteps]
  };
  return map[groupKey] || [];
}

function ensureMinSteps(steps, plantName, defaults = {}) {
  const min = 8;
  const titles = new Set(steps.map(s => (s.title || '').trim().toLowerCase()));
  const extras = [
    { title: 'Kiểm tra đất & pH', text: `Thực hiện kiểm tra đất định kỳ; điều chỉnh pH để phù hợp với ${plantName} (tham khảo pH khuyến nghị), ghi kết quả thử nghiệm.` },
    { title: 'Vệ sinh & khử trùng', text: 'Vệ sinh dụng cụ, chậu và khu vực trồng; loại bỏ tàn dư cây bệnh để giảm mầm bệnh tích tụ.' },
    { title: 'Lịch bón chi tiết', text: 'Lập lịch bón phân cụ thể theo giai đoạn sinh trưởng: bón lót, bón thúc, bón khi ra hoa/ra quả; kèm mốc thời gian tham khảo.' },
    { title: 'Quản lý nước nâng cao', text: `Theo dõi độ ẩm đất và điều chỉnh lịch tưới cho ${plantName}; ưu tiên tưới vào sáng sớm hoặc chiều mát để giảm áp lực bệnh.` },
    { title: 'Ghi chép & truy xuất', text: 'Ghi nhật ký đầy đủ: lô giống, ngày gieo/trồng, ngày bón phân, ngày phun thuốc, ngày thu hoạch để phục vụ truy xuất nguồn gốc.' },
    { title: 'Kiểm soát dịch hại nâng cao', text: 'Sử dụng bẫy dính, thiên địch và chế phẩm sinh học; chụp ảnh và ghi chép tình trạng hại để theo dõi hiệu quả can thiệp.' },
    { title: 'Thu hoạch & phân loại chi tiết', text: 'Xác định tiêu chí thu hoạch (kích thước/màu sắc); thu bằng dụng cụ sạch; phân loại theo chất lượng trước khi đóng gói.' },
    { title: 'Bảo quản & đóng gói', text: 'Hướng dẫn rửa nhẹ, để ráo, đóng gói và bảo quản lạnh hoặc theo tiêu chuẩn loại cây để kéo dài thời gian bảo quản.' }
  ];

  let i = 0;
  while (steps.length < min && i < extras.length) {
    const ex = extras[i++];
    const key = (ex.title || '').trim().toLowerCase();
    if (!titles.has(key)) {
      steps.push(ex);
      titles.add(key);
    }
  }
  return steps;
}

// Per-plant recommended defaults (pot size, watering frequency, spacing)
const plantDefaults = {
  "Dưa leo": { potSize: ">=30L", watering: "2-3 lần/tuần", spacing: "1 cây/m²" },
  "Dưa leo": { potSize: ">=30L", watering: "2-3 lần/tuần", spacing: "1 cây/m²" },
  "Cà chua bi": { potSize: "20-30L", watering: "2-3 lần/tuần", spacing: "1-2 cây/chậu" },
  "Dâu tây": { potSize: "chậu treo/giỏ", watering: "2 lần/tuần (giữ ẩm đều)", spacing: "15-20cm" },
  "Ớt chuông": { potSize: "15-20L", watering: "2-3 lần/tuần", spacing: "30cm" },
  "Mướp": { potSize: ">=30L", watering: "2-3 lần/tuần", spacing: "1 cây/m²" },
  "Xà lách": { potSize: "chậu nông 15-20cm", watering: "hằng ngày/tuỳ thời tiết", spacing: "mật độ dày" },
  "Rau muống": { potSize: "thùng nước hoặc chậu ẩm", watering: "giữ ẩm cao", spacing: "giâm dày" },
  "Cà rốt baby": { potSize: ">=25cm sâu", watering: "giữ ẩm đều", spacing: "3-4cm" }
};

const groupDefaults = {
  "Cây ăn quả ngắn hạn": { potSize: "20-30L", watering: "2-3 lần/tuần" },
  "Rau ăn lá": { potSize: "chậu nông 15-20cm", watering: "hằng ngày/tuỳ thời tiết" },
  "Rau củ (cây củ)": { potSize: ">=25cm sâu", watering: "giữ ẩm đều" },
  "Gia vị/Thảo mộc": { potSize: "10-15cm", watering: "2-3 lần/tuần" },
};

// Chi tiết thực tiễn cho từng giống (mô tả đầy đủ và các bước rõ ràng)
const plantDetails = {
    "Dưa leo": {
      description: "Dưa leo ưa ấm, sinh trưởng nhanh; phù hợp trồng giàn trong chậu >=30L hoặc luống có giàn.",
      steps: [
        { title: "Vật tư & dụng cụ", text: "Chậu >=30L; giá thể tơi xốp; phân hữu cơ hoai mục; perlite/vermiculite; giàn leo; dây buộc mềm; kéo tỉa; bình phun; nhật ký canh tác." },
        { title: "Chuẩn bị giá thể", text: "Pha giá thể 50-60% đất sạch/than bùn + 30-40% phân hữu cơ hoai mục + 5-10% perlite; kiểm tra pH 6.0-6.8; nếu tái dùng giá thể thì khử trùng và bổ sung phân hoai." },
        { title: "Chọn giống & ươm", text: "Dùng giống công bố; ngâm hạt 6-8 giờ; ươm trong khay ở 22-28°C; khi cây con 2-3 lá thật chuyển sang chậu chính." },
        { title: "Trồng & mật độ", text: "Trồng 1 cây/chậu 30L hoặc 2-3 cây/m² trên luống giàn; giàn cao 1.5-2m; đảm bảo 6-8 giờ nắng/ngày." },
        { title: "Dẫn dây & tỉa", text: "Dẫn thân chính lên giàn, buộc bằng dây mềm; tỉa cành phụ để tập trung dinh dưỡng cho thân chính và quả; giữ thông gió giữa các thân." },
        { title: "Tưới (lịch tham khảo)", text: "Tưới sâu 2-3 lần/tuần; tăng khi nắng nóng; tưới sáng sớm hoặc chiều mát; tránh để nước đọng trên lá về đêm." },
        { title: "Bón phân (tham khảo)", text: "Bón lót: 2-3 kg phân hữu cơ hoai mục/chậu; bón thúc: NPK cân đối 10-10-10 (20-30g/chậu) mỗi 2-3 tuần; giai đoạn ra hoa/ra quả tăng Kali; ghi nhật ký bón phân (ngày, loại, lượng)." },
        { title: "Quản lý dịch hại (IPM)", text: "Kiểm tra 2-3 lần/tuần: rệp, sâu, nhện đỏ, nấm. Áp dụng biện pháp sinh học (bẫy dính, BT, neem). Khi cần thuốc hóa học, tuân thủ PHI và ghi chép chi tiết (tên thuốc, liều, ngày)." },
        { title: "Thu hoạch & hậu thu hoạch", text: "Thu quả đạt kích thước tiêu chuẩn; hái bằng kéo; rửa nhẹ, để ráo; phân loại theo chất lượng; dán nhãn lô (ngày, chậu, người thu hoạch)." }
      ]
    },

    "Cà chua bi": {
      description: "Cà chua bi phù hợp chậu 20-30L; cần cọc/bục và ánh sáng mạnh; chu kỳ ~60-90 ngày.",
      steps: [
        { title: "Vật tư & chuẩn bị", text: "Chậu 20-30L; giá thể tơi xốp giàu mùn; phân hữu cơ hoai mục 2-3 kg/chậu; cọc/giàn; dây buộc mềm; kéo; bình phun." },
        { title: "Ươm & ghép", text: "Ươm hạt trong khay; giữ ẩm và ấm 20-25°C; ghép khi cây con 2-3 lá thật; trồng 1-2 cây/chậu; cắm cọc ngay khi trồng." },
        { title: "Buộc & tỉa", text: "Buộc thân vào cọc, tỉa cành kém khỏe để tăng thông gió; loại bỏ quả nhỏ, hoa thừa để tập trung năng lượng cho quả chất lượng." },
        { title: "Tưới & bón", text: "Tưới đều (1 lần/ngày) hoặc theo nhu cầu; bón lót hữu cơ; bón thúc NPK cân đối mỗi 10-14 ngày; tăng Kali khi ra hoa; theo dõi thiếu vi lượng (Ca, Mg) và bổ sung nếu cần." },
        { title: "Quản lý sâu bệnh", text: "Theo dõi rệp, nhện, nấm; ưu tiên bẫy dính và chế phẩm sinh học; nếu dùng thuốc, tuân thủ hướng dẫn và PHI; ghi nhật ký canh tác." },
        { title: "Thu hoạch & bảo quản", text: "Thu quả khi chín đỏ; cắt bằng kéo để giữ cuống; phân loại theo kích thước; ghi lô thu hoạch." }
      ]
    },

    "Dâu tây": {
      description: "Dâu tây ưa đất giàu mùn, thoát nước tốt; thích hợp chậu treo/giỏ; nhạy cảm với ngập và sâu bệnh đất.",
      steps: [
        { title: "Vật tư & giá thể", text: "Chậu treo/giỏ có lỗ thoát; giá thể giàu mùn (50-70% mùn + phân hoai mục); pH 5.5-6.5; phân bón lỏng cho cây ăn quả nhỏ." },
        { title: "Chọn cây con & trồng", text: "Chọn cây con khỏe; trồng với khoảng cách 15-20cm; đặt chậu nơi sáng buổi sáng, tránh mưa lớn." },
        { title: "Tưới & độ ẩm", text: "Tưới đều, giữ ẩm nhưng không để ngập; ưu tiên tưới gốc, tránh ướt trái/ lá để giảm bệnh." },
        { title: "Dinh dưỡng", text: "Bón lót hữu cơ; bón phân lỏng cân đối vào giai đoạn ra hoa và đậu quả; ưu tiên phân hữu cơ lỏng khi có thể." },
        { title: "Phòng bệnh", text: "Đảm bảo thông gió; theo dõi nấm, rệp; xử lý bằng biện pháp sinh học; thay giá thể khi mầm bệnh tích tụ." },
        { title: "Thu hoạch & xử lý", text: "Hái quả chín bằng tay, cắt cuống; rửa nhẹ; để ráo; phân loại và ghi lô." }
      ]
    },

    "Ớt chuông": {
      description: "Ớt chuông ưa sáng và đất giàu dinh dưỡng; trồng chậu 15-20L hoặc luống.",
      steps: [
        { title: "Vật tư & chuẩn bị", text: "Chậu 15-20L; giá thể tơi xốp giàu mùn; phân hữu cơ hoai mục; cọc nếu cần; bình phun; kéo tỉa." },
        { title: "Trồng & mật độ", text: "Trồng cây con khỏe; khoảng cách ~30cm; buộc nhẹ nếu cần hỗ trợ thân khi lớn." },
        { title: "Dinh dưỡng & canxi", text: "Bón lót hữu cơ; bón thúc NPK khi cây lớn; bổ sung canxi nếu xuất hiện thối điểm cuống; ghi nhật ký bón." },
        { title: "Quản lý dịch hại", text: "Theo dõi rệp, bọ trĩ, nhện; ưu tiên biện pháp sinh học; nếu dùng thuốc, tuân thủ PHI và ghi chi tiết." },
        { title: "Thu hoạch", text: "Thu quả khi đạt màu/kích thước; hái bằng kéo; phân loại và ghi lô." }
      ]
    },

    "Mướp": {
      description: "Mướp là cây leo phát triển nhanh; phù hợp chậu lớn có giàn.",
      steps: [
        { title: "Vật tư & chuẩn bị", text: "Chậu >=30L; giàn leo; giá thể nhiều mùn; dây buộc mềm; phân hữu cơ hoai mục; kéo tỉa." },
        { title: "Gieo & chọn cây", text: "Gieo 2-3 hạt/ổ; tỉa sớm giữ 1 cây khỏe; ươm trước nếu cần chọn cây con khỏe." },
        { title: "Dẫn dây & chăm sóc thân", text: "Dẫn thân lên giàn; tỉa cành che khuất; đảm bảo thông gió để giảm bệnh." },
        { title: "Tưới & bón", text: "Tưới sâu 2-3 lần/tuần; bón kali khi ra hoa; bón hữu cơ theo chu kỳ 2-3 tuần; ghi nhật ký." },
        { title: "Thu hoạch liên tục", text: "Hái quả non/đủ dùng thường xuyên để kích thích quả mới; cắt bằng kéo; phân loại và ghi lô." }
      ]
    },

    "Xà lách": {
      description: "Xà lách chu kỳ 30-45 ngày; thích hợp chậu nông hoặc khay ươm.",
      steps: [
        { title: "Vật tư & giá thể", text: "Chậu nông 15-20cm hoặc khay; giá thể tơi xốp; phân hữu cơ hoai mục; kéo/găng tay." },
        { title: "Gieo & ươm", text: "Gieo hạt mỏng, phủ 1-2mm; giữ ẩm đều; che nắng gắt; ươm trong nhà nếu trời lạnh." },
        { title: "Ánh sáng & tưới", text: "Ánh sáng gián tiếp 4-6h/ngày; tưới nhẹ sáng sớm hoặc chiều mát; tránh ngập." },
        { title: "Dinh dưỡng", text: "Bón phân lỏng nhẹ mỗi 10-14 ngày (theo hướng dẫn sản phẩm); tránh thừa đạm." },
        { title: "Thu hoạch & bảo quản", text: "Cắt lá ngoài khi vừa đủ; hoặc nhổ cả cây; rửa sạch; bảo quản mát; ghi lô." }
      ]
    },

    "Rau muống": {
      description: "Rau muống ưa ẩm; có thể trồng trong thùng nước hoặc chậu ẩm; thu hoạch nhanh và tái sinh.",
      steps: [
        { title: "Vật tư & nguồn nước", text: "Thùng nước hoặc chậu; giá thể nhiều mùn; đảm bảo nước tưới sạch." },
        { title: "Gieo/giâm", text: "Giâm cành hoặc gieo hạt; giữ gốc ẩm; che nắng mạnh." },
        { title: "Dinh dưỡng", text: "Bón phân hữu cơ dạng lỏng loãng mỗi 1-2 tuần; tránh phân tươi chưa hoai." },
        { title: "Thu hoạch & tái sinh", text: "Cắt ngọn 15-20 ngày; giữ lại gốc để tái sinh; ghi ngày thu." }
      ]
    },

    "Rau thơm hỗn hợp": {
      description: "Hỗn hợp rau thơm trồng xen kẽ, thu hoạch theo nhu cầu; phù hợp chậu nhỏ.",
      steps: [
        { title: "Chọn giống & bố trí", text: "Chọn nhiều giống (húng, kinh giới, ngò, mùi); trồng xen kẽ theo kích thước để tối ưu không gian." },
        { title: "Cắt tỉa & kích thích phân nhánh", text: "Cắt thường xuyên để kích thích phân nhánh; tránh cắt quá sâu (không quá 1/3 cây một lần)." },
        { title: "Bảo quản", text: "Rửa trước khi dùng; bảo quản tươi trong túi ướt lạnh nếu cần; ghi lô khi bán thương mại." }
      ]
    },

    "Rau mầm": {
      description: "Rau mầm thu hoạch nhanh (5-14 ngày); phù hợp khay ươm trong nhà; chú ý an toàn thực phẩm.",
      steps: [
        { title: "Ngâm hạt", text: "Ngâm hạt 6-12 giờ (tùy loại), rửa sạch; gieo dày trên khay sạch và vô trùng nếu có thể." },
        { title: "Tưới sương & thông gió", text: "Tưới nhẹ 2-3 lần/ngày; tránh ngập; đảm bảo thông gió để hạn chế nấm mốc." },
        { title: "Thu hoạch & an toàn", text: "Cắt khi đạt kích thước ăn được; rửa kỹ và bảo quản lạnh; ghi lô sản xuất để truy xuất nguồn gốc." }
      ]
    },

    "Cà rốt baby": {
      description: "Cà rốt baby phù hợp chậu dài; cần đất nhẹ, giữ ẩm đều để củ thẳng và nhỏ.",
      steps: [
        { title: "Vật tư & chậu", text: "Chậu sâu >=25cm; giá thể nhẹ (cát + mùn); phân hữu cơ hoai mục; kiểm tra pH 6.0-6.8." },
        { title: "Gieo & tỉa", text: "Gieo thưa; tỉa sau nảy mầm để giữ khoảng cách 3-4cm; giữ ẩm đều." },
        { title: "Bón & quản lý", text: "Bón lót hữu cơ; tránh phân tươi và lượng đạm cao; bón bổ sung kali/phốt pho nhẹ giúp củ phát triển." },
        { title: "Thu hoạch", text: "Nhổ khi củ đạt kích thước mong muốn (60-70 ngày); làm sạch nhẹ, phân loại; ghi lô." }
      ]
    },

    "Củ cải trắng": {
      description: "Củ cải trắng ưa đất hơi chua; phù hợp chậu sâu để củ phát triển; thu hoạch nhanh (40-60 ngày).",
      steps: [
        { title: "Vật tư & giá thể", text: "Chậu sâu; giá thể giàu mùn, thoát nước tốt; pH hơi chua (≈6.0)." },
        { title: "Gieo & khoảng cách", text: "Gieo nông, để khoảng cách 5-7cm giữa cây; che nắng khi quá gắt để tránh củ bị cứng hoặc nứt." },
        { title: "Tưới & dinh dưỡng", text: "Giữ ẩm đều, tưới sâu nhưng không để ngập; bón lót phân hữu cơ; hạn chế phân N tươi vì làm lá nhiều nhưng củ kém phát triển." },
        { title: "Phòng bệnh & sâu", text: "Kiểm tra rệp, sâu ăn lá; dùng bón hữu cơ hoặc chế phẩm sinh học; luân canh hoặc thay giá thể khi có dấu hiệu bệnh đất." },
        { title: "Thu hoạch & xử lý", text: "Nhổ khi củ đạt kích thước mong muốn (40-60 ngày); làm sạch nhẹ, loại bỏ củ bị hư; ghi lô và ngày thu." }
      ]
    },

    "Củ hành nhỏ": {
      description: "Hành nhỏ/tỏi con trồng từ củ hoặc gieo hạt; thu hoạch lá xanh hoặc củ nhỏ.",
      steps: [
        { title: "Chuẩn bị & trồng", text: "Chậu nông hoặc luống; giá thể thoát nước; trồng từ củ giống sạch hoặc giâm; giữ ẩm đều." },
        { title: "Chăm sóc", text: "Bón hữu cơ nhẹ; tưới đều; tránh ngập; theo dõi bệnh thân gốc." },
        { title: "Thu hoạch & bảo quản", text: "Cắt phần lá để dùng hoặc nhổ củ khi đạt kích thước; làm sạch và phơi khô nhẹ nếu cần bảo quản lâu." }
      ]
    },

    "Củ cải đỏ": {
      description: "Củ cải đỏ (radish) phát triển rất nhanh, phù hợp gieo xen và trồng chậu shallow.",
      steps: [
        { title: "Gieo & mật độ", text: "Gieo nông, mỏng; không phủ quá dày; đảm bảo độ ẩm đều để củ giòn." },
        { title: "Tưới & thu hoạch", text: "Tưới đều; thu hoạch sớm (30-45 ngày) khi củ còn giòn; rửa và phân loại." }
      ]
    },

    "Khoai tây mini": {
      description: "Khoai tây mini trồng chậu sâu; cần chăm sóc phủ đất (earthing up) để phát triển củ.",
      steps: [
        { title: "Chuẩn bị củ giống", text: "Dùng củ giống khỏe có mắt; cắt nếu lớn và để khô vết cắt 1-2 ngày trước trồng." },
        { title: "Trồng & phủ đất", text: "Trồng sâu, khi thân phát triển thì phủ thêm đất quanh thân (earthing up) để kích thích củ phát triển." },
        { title: "Tưới & bón", text: "Tưới vừa phải; bón lót hữu cơ; tránh ngập; ghi nhật ký canh tác." },
        { title: "Thu hoạch", text: "Thu khi lá vàng và khô; nhổ nhẹ, làm sạch và phơi ráo trước khi bảo quản." }
      ]
    },

    "Húng quế": {
      description: "Húng quế ưa sáng và đất thoát nước; thu hoạch bằng cắt ngọn để kích thích phân nhánh.",
      steps: [
        { title: "Giâm/ươm & trồng", text: "Giâm cành hoặc gieo hạt; trồng chậu 10-15cm; đặt nơi nhiều nắng." },
        { title: "Tỉa & thu hoạch", text: "Cắt ngọn thường xuyên; không cắt quá 1/3 cây một lần; rửa trước khi dùng." },
        { title: "Bảo quản", text: "Bảo quản tươi trong tủ lạnh hoặc chế biến/sấy để lưu trữ lâu." }
      ]
    },

    "Hành lá": {
      description: "Hành lá dễ trồng, có thể trồng từ củ hoặc giâm; tái sinh nhanh.",
      steps: [
        { title: "Trồng từ củ hoặc giâm", text: "Cắm củ giống hoặc giâm thân vào đất ẩm; chuyển sang chậu khi rễ phát triển; giữ ẩm đều." },
        { title: "Thu hoạch & tái sinh", text: "Cắt phần xanh để dùng; giữ lại gốc cho lần thu tiếp theo; ghi ngày thu." }
      ]
    },

    "Ngò rí": {
      description: "Ngò rí ưa đất thoát nước và ánh sáng vừa phải; trồng xen kẽ để tiết kiệm không gian.",
      steps: [
        { title: "Gieo & chăm sóc", text: "Gieo mỏng; giữ ẩm đều; tránh để cây già để giảm vị đắng; thu hoạch lá non." },
        { title: "Thu hoạch", text: "Cắt lá non theo nhu cầu; rửa sạch trước khi dùng; ghi lô nếu bán thương mại." }
      ]
    },

    "Sả": {
      description: "Sả ưa nắng; trồng bằng giâm thân; dùng tươi hoặc phơi khô.",
      steps: [
        { title: "Chuẩn bị & giâm", text: "Giâm thân sả trong đất giàu hữu cơ; đặt nơi nhiều nắng; giữ ẩm vừa đủ." },
        { title: "Chăm sóc", text: "Bón hữu cơ định kỳ; tưới đều; thu hoạch thân khi đạt kích thước dùng." }
      ]
    },

    "Hương thảo": {
      description: "Hương thảo ưa đất thoát nước và nhiều nắng; phù hợp chậu nhỏ để trang trí và gia vị.",
      steps: [
        { title: "Đất & ánh sáng", text: "Dùng giá thể thoát nước tốt; đặt nơi nhiều nắng; tưới khi đất bắt đầu khô." },
        { title: "Thu hoạch & cắt tỉa", text: "Cắt cành nhỏ để dùng; tránh cắt quá mạnh để cây không sốc." }
      ]
    },

    "Ổi lùn": {
      description: "Ổi lùn phù hợp chậu; cho quả ăn được; cần ánh sáng và đất giàu dinh dưỡng.",
      steps: [
        { title: "Chậu & đất", text: "Chọn chậu lớn; giá thể giàu hữu cơ, thoát nước tốt; chọn giống lùn phù hợp chậu." },
        { title: "Trồng & bón", text: "Trồng cây con khỏe; bón hữu cơ mỗi 1-2 tháng; tưới sâu khi khô; theo dõi sâu bệnh." },
        { title: "Cắt tỉa & thu hoạch", text: "Cắt tỉa để duy trì tán; thu hoạch khi quả chín; phân loại và ghi lô." }
      ]
    },

    "Chanh dây nhỏ": {
      description: "Chanh dây nhỏ thích leo giàn; cần giàn chắc, đất thoát nước và đánh giá dinh dưỡng khi ra quả.",
      steps: [
        { title: "Giàn & trồng", text: "Cung cấp giàn chịu lực; chọn cây con khỏe; trồng sâu và buộc gọn khi cần." },
        { title: "Bón & tưới", text: "Bón lót hữu cơ; bổ sung kali khi ra hoa; tưới đều, tránh úng; ghi nhật ký bón tưới." },
        { title: "Quản lý dịch hại & thu hoạch", text: "Giám sát sâu bệnh; dùng biện pháp sinh học ưu tiên; thu quả khi chín; ghi lô." }
      ]
    },

    "Lê cảnh nhỏ": {
      description: "Lê cảnh nhỏ trồng làm cảnh, có thể cho quả ăn; chăm sóc giống cây cảnh.",
      steps: [
        { title: "Chọn chậu & trồng", text: "Chọn chậu phù hợp với hệ rễ; giá thể thoát nước; trồng cây con khỏe." },
        { title: "Chăm sóc & phòng bệnh", text: "Tưới và bón vừa phải; kiểm tra sâu bệnh; xử lý bằng biện pháp sinh học khi có dấu hiệu." }
      ]
    },

    "Cây hoa ăn được": {
      description: "Các loài hoa ăn được (nasturtium, calendula...) có thể trồng chậu; tuân thủ an toàn thực phẩm (không dùng thuốc trên phần ăn được).",
      steps: [
        { title: "Chọn giống & trồng", text: "Chọn giống hoa ăn được; dùng giá thể sạch; trồng nơi thoáng và nhiều nắng tùy loài." },
        { title: "Thu hoạch & an toàn thực phẩm", text: "Thu hoa vào sáng sớm; rửa kỹ; tránh sử dụng thuốc trên phần ăn được; ghi lô để truy xuất." }
      ]
    }
  };

function makeContent(plantName, label, defaults = {}) {
  return `
  <h2>${plantName} — ${label}</h2>
  <p>${plantName} phù hợp trồng trên ban công hoặc sân thượng; áp dụng các nguyên tắc an toàn theo VietGAP để đảm bảo chất lượng và an toàn thực phẩm.</p>
  <p><strong>Khuyến nghị thực tế:</strong> Kích thước chậu: ${defaults.potSize || 'tùy loại'}, Tưới: ${defaults.watering || 'theo điều kiện'}.</p>
  <h3>Nguyên tắc VietGAP áp dụng</h3>
  <ul>
    <li>Chọn giống sạch bệnh, rõ nguồn gốc.</li>
    <li>Quản lý dịch hại theo IPM, ưu tiên biện pháp sinh học.</li>
    <li>Quản lý phân bón và nước tưới để tránh dư lượng và ô nhiễm.</li>
    <li>Ghi chép toàn bộ quy trình để truy xuất nguồn gốc.</li>
  </ul>
  `;
}

async function run() {
  await connectDB();
  console.log("✅ Connected to MongoDB");

  // Backup existing guides
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(process.cwd(), "scripts", `backup_guides_before_apply_${ts}.json`);
  const allGuides = await Guide.find({ deleted: false }).lean();
  fs.writeFileSync(backupPath, JSON.stringify(allGuides, null, 2), "utf-8");
  console.log(`🗄️  Backup saved to ${backupPath} (total ${allGuides.length} guides)`);

  // Find guides by plant_group and update
  let totalUpdated = 0;
  for (const groupKey of Object.keys(templates)) {
    const tpl = templates[groupKey];
    const guides = await Guide.find({ plant_group: groupKey, deleted: false }).sort({ createdAt: 1 });
    if (!guides || guides.length === 0) continue;

    for (let i = 0; i < guides.length; i++) {
      const guide = guides[i];
      const plantName = tpl.plants[i % tpl.plants.length];
      // Use detailed plant info if available
      const detail = plantDetails[plantName] || {};
      const title = plantName; // only the plant name in title as requested
      const defaults = plantDefaults[plantName] || groupDefaults[tpl.label] || {};
      const description = detail.description || `${plantName} phù hợp trồng trên ban công, sân thượng hoặc chậu. Hướng dẫn thực hành theo nguyên tắc VietGAP.`;
      const content = (detail.content || "") + makeContent(plantName, tpl.label, defaults);

      // Prefer plant-specific steps if provided; otherwise build customized VietGAP steps
      let steps = [];
      if (detail.steps && Array.isArray(detail.steps) && detail.steps.length > 0) {
        steps = detail.steps;
      } else {
        steps = makeVietGAPStepsCustomized(plantName, defaults);
      }

      // Merge additional templates for this group (transplant/pot/seed/large tree) before dedupe
      const additionalTemplates = getAdditionalStepTemplatesForGroup(groupKey);
      const additionalSteps = [];
      for (const tplSteps of additionalTemplates) {
        for (const s of tplSteps) {
          additionalSteps.push(s);
        }
      }
      // Prepend additionalSteps so transplant/planting fundamentals come first
      steps = [...additionalSteps, ...steps];

      // Deduplicate steps by title (case-insensitive)
      const seen = new Set();
      steps = steps.filter(s => {
        const key = (s.title || "").trim().toLowerCase();
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Ensure at least 8 steps per plant (append expert-standard steps if needed)
      steps = ensureMinSteps(steps, plantName, defaults);
      const plantTags = tpl.plantTags;
      const tags = [...tpl.tagsBase, plantName];

      await Guide.updateOne({ _id: guide._id }, {
        $set: {
          title,
          plant_name: plantName,
          description,
          content,
          steps,
          plantTags,
          tags,
          status: "published"
        }
      });
      totalUpdated++;
    }
    console.log(`🔁 Updated ${guides.length} guides for group ${groupKey}`);
  }

  console.log(`\n✅ Done. Total guides updated: ${totalUpdated}`);

  // Print sample of updated guides (5 newest)
  const sample = await Guide.find({ deleted: false }).sort({ updatedAt: -1 }).limit(5).select('title plant_name plant_group plantTags tags expert_id createdAt updatedAt').lean();
  console.log("\n📌 Sample updated guides:");
  console.log(JSON.stringify(sample, null, 2));

  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
