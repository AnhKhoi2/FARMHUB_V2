// Utility to provide a deterministic color for a given key (e.g., plant group)
// Each distinct key maps to one color from the palette.

const PALETTE = [
  '#f50', // red
  '#2db7f5', // light blue
  '#87d068', // green
  '#108ee9', // blue
  '#ff7a45', // orange
  '#7265e6', // purple
  '#ffbf00', // amber
  '#00a2ae', // teal
  '#1890ff', // antd blue
  '#52c41a', // antd green
  '#fa8c16', // golden
  '#13c2c2', // cyan
  '#eb2f96', // pink
  '#a0d911', // lime
  '#722ed1', // deep purple
];

function hashString(str) {
  let h = 0;
  if (!str) return h;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // convert to 32bit integer
  }
  return Math.abs(h);
}

export function getColorForKey(key) {
  if (!key) return PALETTE[0];
  const k = String(key).trim();
  const idx = hashString(k) % PALETTE.length;
  return PALETTE[idx];
}

export default getColorForKey;
