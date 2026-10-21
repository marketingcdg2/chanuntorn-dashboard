import { timingSafeEqual } from "node:crypto";
import { validDate } from "../src/utils/report.js";
const ACCOUNTS = {
  motto: "2067772447288424",
  mono: "783833721188530",
  mews: "1822065945093567",
};
const normalize = (row) => ({
  name: row.ad_name || row.adset_name || row.campaign_name,
  objective: row.objective,
  date: row.date_start,
  spend: Number(row.spend || 0),
  impressions: Number(row.impressions || 0),
  clicks: Number(row.clicks || 0),
  messages: Number(
    (row.actions || []).find(
      (a) =>
        a.action_type === "onsite_conversion.messaging_conversation_started_7d",
    )?.value || 0,
  ),
});
export function registerReportApi(
  app,
  store,
  env = process.env,
  request = fetch,
) {
  async function graph(account, params) {
    if (!env.FB_TOKEN)
      throw new Error("ยังไม่ได้ตั้งค่า FB_TOKEN ที่เซิร์ฟเวอร์");
    const version = env.META_API_VERSION || "v25.0";
    let url = new URL(
      `https://graph.facebook.com/${version}/act_${account}/insights`,
    );
    Object.entries({
      ...params,
      limit: "500",
      access_token: env.FB_TOKEN,
    }).forEach(([k, v]) => url.searchParams.set(k, v));
    const rows = [];
    while (url) {
      const response = await request(url, {
        signal: AbortSignal.timeout(45000),
      });
      const json = await response.json();
      if (!response.ok || json.error)
        throw new Error(json.error?.message || "Meta API ไม่พร้อมใช้งาน");
      rows.push(...(json.data || []));
      const next = json.paging?.next ? new URL(json.paging.next) : null;
      if (
        next &&
        (next.hostname !== "graph.facebook.com" || next.protocol !== "https:")
      )
        throw new Error("Invalid Meta pagination URL");
      url = next;
    }
    return rows.map(normalize);
  }
  app.get("/api/report", async (req, res) => {
    const { project, since, until } = req.query;
    if (
      !Object.hasOwn(ACCOUNTS, project || "") ||
      !validDate(since) ||
      !validDate(until) ||
      since > until ||
      (Date.parse(until) - Date.parse(since)) / 86400000 > 366
    )
      return res
        .status(400)
        .json({ error: "เลือกโครงการและช่วงวันที่ไม่เกิน 367 วัน" });
    try {
      const params = { time_range: JSON.stringify({ since, until }) };
      const fields = "spend,impressions,clicks,actions";
      const [campaigns, groups, creatives, daily] = await Promise.all([
        graph(ACCOUNTS[project], {
          ...params,
          level: "campaign",
          fields: `campaign_name,objective,${fields}`,
        }),
        graph(ACCOUNTS[project], {
          ...params,
          level: "adset",
          fields: `adset_name,${fields}`,
        }),
        graph(ACCOUNTS[project], {
          ...params,
          level: "ad",
          fields: `ad_name,objective,${fields}`,
        }),
        graph(ACCOUNTS[project], {
          ...params,
          level: "account",
          time_increment: "1",
          fields,
        }),
      ]);
      res.json({ campaigns, groups, creatives, daily, platform: "meta" });
    } catch (error) {
      res.status(502).json({ error: error.message });
    }
  });
  app.get("/api/manual-results", (req, res) => {
    if (!Object.hasOwn(ACCOUNTS, req.query.project || ""))
      return res.status(400).json({ error: "โครงการไม่ถูกต้อง" });
    res
      .set("Cache-Control", "no-store")
      .json({
        data: store.list(req.query.project),
        writable: !!env.DASHBOARD_WRITE_TOKEN,
      });
  });
  app.put("/api/manual-results", (req, res) => {
    if (!env.DASHBOARD_WRITE_TOKEN)
      return res
        .status(503)
        .json({ error: "ยังไม่ได้ตั้งค่ารหัสบันทึกผลที่เซิร์ฟเวอร์" });
    const expected = Buffer.from(`Bearer ${env.DASHBOARD_WRITE_TOKEN}`);
    const actual = Buffer.from(req.headers.authorization || "");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return res.status(401).json({ error: "รหัสบันทึกผลไม่ถูกต้อง" });
    try {
      res.json({ data: store.save(req.body) });
    } catch (error) {
      res.status(error.status || 400).json({ error: error.message });
    }
  });
}
