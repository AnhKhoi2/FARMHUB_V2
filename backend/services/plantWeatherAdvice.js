// services/plantWeatherAdvice.js

// Đổi AQI 1–5 sang nhãn tiếng Việt
function mapAqiLabel(aqi) {
  switch (aqi) {
    case 1:
      return { label: "Tốt", note: "Không khí sạch, rất thuận lợi cho cây." };
    case 2:
      return { label: "Chấp nhận được", note: "Không khí ổn, có thể chăm cây bình thường." };
    case 3:
      return { label: "Trung bình", note: "Nên ưu tiên thông thoáng không khí, hạn chế bụi." };
    case 4:
      return { label: "Xấu", note: "Nên che chắn bụi, hạn chế tưới phun sương ngoài trời." };
    case 5:
      return { label: "Rất xấu", note: "Nên hạn chế để cây non ở nơi gần đường lớn, nhiều khói bụi." };
    default:
      return { label: "Không rõ", note: "" };
  }
}

// Lấy các thông số cơ bản từ payload OpenWeather
function extractWeatherBasics(weatherPayload) {
  if (!weatherPayload) return {};

  const main = weatherPayload.main || {};
  const temp = typeof main.temp === "number" ? main.temp : null;
  const humidity = typeof main.humidity === "number" ? main.humidity : null;

  const rainObj = weatherPayload.rain || {};
  const rain1h = typeof rainObj["1h"] === "number" ? rainObj["1h"] : 0;

  const windObj = weatherPayload.wind || {};
  const windSpeed = typeof windObj.speed === "number" ? windObj.speed : null;

  const uvi = typeof weatherPayload.uvi === "number" ? weatherPayload.uvi : null;

  return { temp, humidity, rain1h, windSpeed, uvi };
}

export function buildPlantAdvice({ weatherPayload, airPayload, plantGroup = "other" }) {
  const tips = [];
  const extraNotes = [];

  const { temp, humidity, rain1h, windSpeed, uvi } = extractWeatherBasics(weatherPayload);

  // Đánh giá điều kiện
  const isHot = typeof temp === "number" && temp >= 32;
  const isVeryHot = typeof temp === "number" && temp >= 36;
  const isCool = typeof temp === "number" && temp <= 20;
  const isCold = typeof temp === "number" && temp <= 15;

  const isDryAir = typeof humidity === "number" && humidity < 45;
  const isHumid = typeof humidity === "number" && humidity > 80;

  const isRainy = rain1h >= 2;
  const isLightRain = rain1h > 0 && rain1h < 2;
  const isWindy = typeof windSpeed === "number" && windSpeed >= 8;

  const isHighUvi = typeof uvi === "number" && uvi >= 8;
  const isMediumUvi = typeof uvi === "number" && uvi >= 5 && uvi < 8;

  // AQI
  let aqi = null;
  if (airPayload?.list?.[0]?.main?.aqi) {
    aqi = airPayload.list[0].main.aqi;
  }
  const { label: aqiLabel, note: aqiNote } = mapAqiLabel(aqi);

  // Gợi ý tổng quát theo thời tiết
  if (isVeryHot) {
    tips.push("Nhiệt độ rất cao (≥ 36°C), nên che nắng và tưới vào sáng sớm hoặc chiều mát để tránh sốc nhiệt.");
  } else if (isHot) {
    tips.push("Hôm nay khá nóng (≥ 32°C), kiểm tra độ ẩm đất thường xuyên và che nắng nhẹ cho cây vào buổi trưa.");
  } else if (isCold) {
    tips.push("Nhiệt độ thấp (≤ 15°C), hạn chế tưới nhiều nước và che phủ gốc để giữ ấm cho rễ.");
  } else if (isCool) {
    tips.push("Thời tiết mát (≤ 20°C), chăm sóc bình thường nhưng hạn chế tưới vào tối muộn để tránh nấm bệnh.");
  }

  if (isDryAir) {
    tips.push("Độ ẩm không khí thấp, nên duy trì độ ẩm đất ổn định, tránh để đất khô hoàn toàn quá lâu.");
  } else if (isHumid) {
    tips.push("Độ ẩm không khí cao (> 80%), hạn chế tưới lên lá, ưu tiên tưới gốc để giảm nguy cơ nấm bệnh.");
  }

  if (isRainy) {
    tips.push("Đang có mưa khá to, tạm giảm hoặc ngưng tưới, chú ý thoát nước tốt để tránh úng rễ.");
  } else if (isLightRain) {
    tips.push("Có mưa nhẹ, vẫn nên kiểm tra độ ẩm đất trước khi tưới thêm.");
  }

  if (isWindy) {
    tips.push("Gió mạnh, nên cố định chậu, tránh để cây thân yếu ở nơi gió lùa trực tiếp.");
  }

  if (isHighUvi) {
    tips.push("Chỉ số UV rất cao, nên che nắng (lưới, rèm) cho cây non hoặc cây ưa bóng vào buổi trưa.");
  } else if (isMediumUvi) {
    tips.push("Chỉ số UV trung bình–cao, cho cây phơi nắng sáng, hạn chế nắng gắt giữa trưa.");
  }

  // Gợi ý theo từng nhóm cây
  switch (plantGroup) {
    case "leaf_vegetable":
      tips.push("Rau ăn lá cần ẩm đều, tránh chu kỳ khô quá rồi mới tưới nhiều một lần.");
      if (isHumid || isRainy) {
        tips.push("Trong điều kiện ẩm cao/mưa, tỉa bớt lá già, lá sâu bệnh và giữ khoảng cách giữa các cây để thông thoáng.");
      }
      break;
    case "root_vegetable":
      tips.push("Rau/cây củ cần đất tơi xốp, thoát nước tốt, tránh úng kéo dài dễ thối củ.");
      if (isRainy) tips.push("Khi mưa to, không tưới thêm, đợi đất ráo rồi mới kiểm tra lại độ ẩm.");
      break;
    case "fruit_short_term":
      tips.push("Rau/quả ngắn ngày cần nắng trực tiếp 4–6 giờ/ngày, nên đặt chậu ở nơi có ánh sáng tốt.");
      if (isHot) {
        tips.push("Ngày nắng nóng, tưới sáng sớm và chiều mát, tránh tưới lên lá lúc trưa.");
      }
      break;
    case "fruit_long_term":
      tips.push("Cây ăn quả dài ngày chịu thời tiết tốt hơn nhưng vẫn cần kiểm tra ẩm độ đất, nhất là cây trồng chậu.");
      break;
    case "bean_family":
      tips.push("Cây họ đậu nhạy cảm với úng nước, đảm bảo lỗ thoát nước không bị nghẹt, nhất là ngày mưa.");
      break;
    case "herb":
      tips.push("Đa số cây gia vị ưa nắng và đất thoát nước nhanh, tránh tưới quá nhiều nếu độ ẩm không khí đã cao.");
      break;
    case "flower_vegetable":
      tips.push("Rau ăn hoa cần đủ nắng để phân hóa mầm hoa, thiếu sáng lâu sẽ chỉ phát triển lá.");
      break;
    default:
      tips.push("Nên kiểm tra đất bằng tay, nếu lớp 2–3 cm trên bề mặt khô thì mới tưới thêm.");
  }

  if (aqiLabel && aqiLabel !== "Không rõ") {
    extraNotes.push(`Chất lượng không khí hiện tại: ${aqiLabel}. ${aqiNote}`);
  }

  let summary = "Điều kiện thời tiết hôm nay tương đối thuận lợi, có thể chăm sóc cây bình thường.";
  if (isVeryHot || isHot) {
    summary = "Hôm nay trời khá nóng, ưu tiên che nắng và tưới vào sáng sớm/chiều mát.";
  } else if (isRainy) {
    summary = "Đang có mưa, nên giảm tưới và chú ý thoát nước cho chậu.";
  } else if (isCold) {
    summary = "Thời tiết lạnh, giữ ấm gốc và hạn chế tưới nhiều nước.";
  }

  return {
    summary,
    aqi,
    aqiLabel,
    tips,
    extraNotes,
    basicConditions: { temp, humidity, rain1h, windSpeed, uvi },
  };
}
