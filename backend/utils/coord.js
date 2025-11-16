import { http } from "./http.js";

/**
 * Ưu tiên: nếu đã có lat/lon thì dùng luôn.
 * Nếu có "q" (query text), dùng Open-Meteo geocoding (free, không cần key)
 */
export async function resolveLocation({ q, lat, lon }) {
  if (lat && lon) {
    return {
      name: q || "Custom location",
      lat: Number(lat),
      lon: Number(lon)
    };
  }
  if (!q) throw new Error("Thiếu q hoặc lat/lon");

  const url = "https://geocoding-api.open-meteo.com/v1/search";
  const { data } = await http.get(url, { params: { name: q, count: 1, language: "vi", format: "json" } });
  const loc = data?.results?.[0];
  if (!loc) throw new Error("Không tìm thấy địa điểm");
  return {
    name: `${loc.name}${loc.admin1 ? ", " + loc.admin1 : ""}${loc.country ? ", " + loc.country : ""}`,
    lat: loc.latitude,
    lon: loc.longitude
  };
}
