export const METRICS = {
  impressions: "Impressions",
  clicks: "Clicks",
  messages: "Inbox",
  spend: "ค่าใช้จ่าย",
  ctr: "CTR",
  cpc: "CPC",
  cpm: "CPM",
  qualify: "Qulify",
  nonQualify: "Non-Qulify",
  clickLine: "Click Line",
};
export const FIXED = ["qualify", "nonQualify", "clickLine"];
export const OPTIONAL = [
  "impressions",
  "clicks",
  "messages",
  "spend",
  "ctr",
  "cpc",
  "cpm",
];
export const BASE = ["impressions", "clicks", "messages", "spend", ...FIXED];
export const PROJECTS = [
  { id: "motto", label: "Motto Scape" },
  { id: "mono", label: "Mono" },
  { id: "mews", label: "Mews" },
];
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function shiftDate(date, days) {
  return new Date(Date.parse(date + "T00:00:00Z") + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function validDate(date) {
  return (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date
  );
}
export function number(value, key) {
  const n = Number(value) || 0;
  return (
    (["spend", "cpc", "cpm"].includes(key) ? "฿" : "") +
    n.toLocaleString("th-TH", {
      maximumFractionDigits: ["ctr", "spend", "cpc", "cpm"].includes(key)
        ? 2
        : 0,
    }) +
    (key === "ctr" ? "%" : "")
  );
}
export function rates(row) {
  return {
    ...row,
    ctr: row.impressions ? (row.clicks / row.impressions) * 100 : 0,
    cpc: row.clicks ? row.spend / row.clicks : 0,
    cpm: row.impressions ? (row.spend / row.impressions) * 1000 : 0,
  };
}
export function total(rows) {
  return rates(
    rows.reduce(
      (a, r) => {
        BASE.forEach((k) => (a[k] += Number(r[k]) || 0));
        return a;
      },
      Object.fromEntries(BASE.map((k) => [k, 0])),
    ),
  );
}
export function groupRows(rows, entries, scope, since, until) {
  const map = new Map();
  for (const row of rows) {
    const name = (row.name || "ไม่มีชื่อ").trim();
    if (!map.has(name))
      map.set(name, {
        name,
        count: 0,
        images: [],
        ...Object.fromEntries(BASE.map((k) => [k, 0])),
      });
    const group = map.get(name);
    group.count++;
    for (const key of ["impressions", "clicks", "messages", "spend"])
      group[key] += Number(row[key]) || 0;
    if (row.image && !group.images.includes(row.image))
      group.images.push(row.image);
  }
  for (const entry of entries) {
    if (entry.scope !== scope || entry.date < since || entry.date > until)
      continue;
    if (!map.has(entry.name))
      map.set(entry.name, {
        name: entry.name,
        count: 0,
        images: [],
        ...Object.fromEntries(BASE.map((k) => [k, 0])),
      });
    const row = map.get(entry.name);
    FIXED.forEach((k) => (row[k] += Number(entry[k]) || 0));
  }
  return [...map.values()].map(rates);
}
export function dailySeries(rows, since, until) {
  const map = new Map(rows.map((row) => [row.date, row]));
  const result = [];
  for (let date = since; date <= until; date = shiftDate(date, 1))
    result.push({ date, ...total(map.has(date) ? [map.get(date)] : []) });
  return result;
}
