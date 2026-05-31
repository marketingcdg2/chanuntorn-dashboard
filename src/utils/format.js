// utils/format.js
export const fmt = {
  thb:   (n) => "฿" + Number(n).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
  num:   (n) => Number(n).toLocaleString("th-TH"),
  pct:   (n) => Number(n).toFixed(2) + "%",
  reach: (n) => n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? (n / 1e3).toFixed(0) + "K" : String(n),
};
