// src/utils/weatherTranslation.js

// 1) Mapping theo description (OpenWeather /description/)
export const descriptionMap = {
  // Trời quang
  "clear sky": "Trời quang đãng",

  // Mây
  "few clouds": "Ít mây",
  "scattered clouds": "Mây rải rác",
  "broken clouds": "Mây đứt đoạn",
  "overcast clouds": "Mây u ám",

  // Mưa
  "light rain": "Mưa nhẹ",
  "moderate rain": "Mưa vừa",
  "heavy intensity rain": "Mưa to",
  "very heavy rain": "Mưa rất to",
  "extreme rain": "Mưa cực lớn",
  "freezing rain": "Mưa tuyết",
  "light intensity shower rain": "Mưa rào nhẹ",
  "shower rain": "Mưa rào",
  "heavy intensity shower rain": "Mưa rào nặng hạt",

  // Mưa đá / tuyết
  "snow": "Tuyết",
  "light snow": "Tuyết nhẹ",
  "heavy snow": "Tuyết dày",
  "sleet": "Mưa tuyết",
  "light shower sleet": "Mưa tuyết nhẹ",
  "shower sleet": "Mưa tuyết rào",

  // Bão / Dông
  "thunderstorm": "Dông",
  "thunderstorm with light rain": "Dông kèm mưa nhẹ",
  "thunderstorm with rain": "Dông kèm mưa",
  "thunderstorm with heavy rain": "Dông kèm mưa lớn",
  "thunderstorm with drizzle": "Dông kèm mưa phùn",
  "light thunderstorm": "Dông nhẹ",
  "heavy thunderstorm": "Dông mạnh",

  // Mù, sương
  "mist": "Sương mù nhẹ",
  "fog": "Sương mù dày",
  "haze": "Mù",
  "smoke": "Khói",
  "dust": "Bụi",
  "sand": "Cát",
  "ash": "Tro bụi",
  "squalls": "Gió giật",
  "tornado": "Lốc xoáy",
};


// 2) Mapping theo "main"
export const mainGroupMap = {
  Thunderstorm: "Dông",
  Drizzle: "Mưa phùn",
  Rain: "Mưa",
  Snow: "Tuyết",
  Mist: "Sương mù",
  Smoke: "Khói",
  Haze: "Mù",
  Dust: "Bụi",
  Fog: "Sương mù",
  Sand: "Cát",
  Ash: "Tro bụi",
  Squall: "Gió giật",
  Tornado: "Lốc xoáy",
  Clear: "Trời quang đãng",
  Clouds: "Nhiều mây",
};


// 3) Mapping theo weather id (OpenWeather weather code)
export const codeMap = {
  200: "Dông kèm mưa nhẹ",
  201: "Dông kèm mưa",
  202: "Dông kèm mưa to",
  210: "Dông nhẹ",
  211: "Dông",
  212: "Dông mạnh",
  221: "Dông thất thường",
  230: "Dông kèm mưa phùn",
  231: "Dông kèm mưa phùn",
  232: "Dông kèm mưa phùn mạnh",

  // Drizzle
  300: "Mưa phùn nhẹ",
  301: "Mưa phùn",
  302: "Mưa phùn to",
  310: "Mưa phùn nhỏ",
  311: "Mưa phùn",
  312: "Mưa phùn lớn",
  313: "Mưa rào phùn",
  314: "Mưa rào phùn to",
  321: "Mưa phùn rào",

  // Rain
  500: "Mưa nhỏ",
  501: "Mưa vừa",
  502: "Mưa to",
  503: "Mưa rất to",
  504: "Mưa cực lớn",
  511: "Mưa tuyết",
  520: "Mưa rào nhẹ",
  521: "Mưa rào",
  522: "Mưa rào to",
  531: "Mưa rào thất thường",

  // Snow
  600: "Tuyết nhẹ",
  601: "Tuyết",
  602: "Tuyết dày",
  611: "Mưa tuyết",
  612: "Mưa tuyết rào",
  613: "Tuyết rào",
  615: "Tuyết nhẹ kèm mưa",
  616: "Tuyết kèm mưa",
  620: "Tuyết nhẹ rào",
  621: "Tuyết rào",
  622: "Tuyết rào dày",

  // Atmosphere
  701: "Sương mù nhẹ",
  711: "Khói",
  721: "Mù",
  731: "Cát bụi",
  741: "Sương mù",
  751: "Cát",
  761: "Bụi",
  762: "Tro bụi",
  771: "Gió giật",
  781: "Lốc xoáy",

  // Clear
  800: "Trời quang đãng",

  // Clouds
  801: "Ít mây",
  802: "Mây rải rác",
  803: "Mây nhiều",
  804: "Mây u ám",
};


// 4) Hàm dịch theo description
export function translateDescription(desc) {
  if (!desc) return "";
  const key = desc.toLowerCase();
  return descriptionMap[key] || desc;
}

// 5) Hàm dịch theo main group
export function translateMainGroup(main) {
  return mainGroupMap[main] || main;
}

// 6) Hàm dịch theo weatherCode (id)
export function translateById(id) {
  return codeMap[id] || "";
}


// 7) Hàm tiện lợi: truyền vào weather object của OpenWeather
export function translateWeather(weatherObj) {
  if (!weatherObj) return "";
  return (
    translateDescription(weatherObj.description) ||
    translateById(weatherObj.id) ||
    translateMainGroup(weatherObj.main) ||
    weatherObj.description
  );
}
