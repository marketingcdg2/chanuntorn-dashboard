require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const multer     = require("multer");
const { v2: cloudinary } = require("cloudinary");

const app   = express();
const TOKEN = process.env.FB_TOKEN;
const PORT  = process.env.PORT || 3000;

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "ไม่พบไฟล์รูป" });
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: "ต้องส่ง key" });
  try {
    const b64     = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;
    const result  = await cloudinary.uploader.upload(dataUri, {
      public_id: `chanuntorn-dashboard/${key.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
      overwrite: true,
    });
    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/upload", async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: "ต้องส่ง key" });
  try {
    const public_id = `chanuntorn-dashboard/${key.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    await cloudinary.uploader.destroy(public_id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/images", async (req, res) => {
  const { project } = req.query;
  const prefix = project
    ? `chanuntorn-dashboard/${project}__`
    : "chanuntorn-dashboard/";
  try {
    const result = await cloudinary.api.resources({
      type: "upload", prefix, max_results: 200,
    });
    const images = {};
    result.resources.forEach(r => {
      const fullKey = r.public_id.replace("chanuntorn-dashboard/", "");
      const key = project
        ? fullKey.replace(`${project}__`, "")
        : fullKey;
      images[key] = r.secure_url;
    });
    res.json({ images });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/insights", async (req, res) => {
  const { account_id, since, until } = req.query;
  if (!account_id || !since || !until)
    return res.status(400).json({ error: "ต้องส่ง account_id, since, until" });
  const fields = "campaign_name,objective,spend,impressions,reach,clicks,ctr,cpm,cpc,actions";
  const url = `https://graph.facebook.com/v19.0/act_${account_id}/insights`
    + `?fields=${fields}&time_range={"since":"${since}","until":"${until}"}`
    + `&level=campaign&limit=100&access_token=${TOKEN}`;
  try {
    const { default: fetch } = await import("node-fetch");
    const data = await (await fetch(url)).json();
    if (data.error) return res.status(400).json(data.error);
    const rows = (data.data||[]).map(r => {
      const msg = (r.actions||[]).find(a=>a.action_type==="onsite_conversion.messaging_conversation_started_7d");
      return { name:r.campaign_name, objective:r.objective?.includes("AWARENESS")?"Awareness":"Engagement",
        spend:parseFloat(r.spend||0), impressions:parseInt(r.impressions||0), reach:parseInt(r.reach||0),
        clicks:parseInt(r.clicks||0), ctr:parseFloat(r.ctr||0), cpm:parseFloat(r.cpm||0),
        cpc:parseFloat(r.cpc||0), messages:msg?parseInt(msg.value):0 };
    });
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/ads", async (req, res) => {
  const { account_id, since, until } = req.query;
  if (!account_id || !since || !until)
    return res.status(400).json({ error: "ต้องส่ง account_id, since, until" });
  const fields = "ad_name,objective,spend,impressions,reach,clicks,actions";
  const url = `https://graph.facebook.com/v19.0/act_${account_id}/insights`
    + `?fields=${fields}&time_range={"since":"${since}","until":"${until}"}`
    + `&level=ad&limit=200&access_token=${TOKEN}`;
  try {
    const { default: fetch } = await import("node-fetch");
    const data = await (await fetch(url)).json();
    if (data.error) return res.status(400).json(data.error);
    const map = {};
    (data.data||[]).forEach(r => {
      const obj = r.objective?.includes("AWARENESS")?"Awareness":"Engagement";
      const key = `${r.ad_name}__${obj}`;
      if (!map[key]) map[key]={name:r.ad_name,objective:obj,spend:0,impressions:0,reach:0,clicks:0,messages:0};
      const msg=(r.actions||[]).find(a=>a.action_type==="onsite_conversion.messaging_conversation_started_7d");
      map[key].spend+=parseFloat(r.spend||0); map[key].impressions+=parseInt(r.impressions||0);
      map[key].reach+=parseInt(r.reach||0); map[key].clicks+=parseInt(r.clicks||0);
      map[key].messages+=msg?parseInt(msg.value):0;
    });
    res.json({ data: Object.values(map) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/audience", async (req, res) => {
  const { account_id, since, until } = req.query;
  if (!account_id || !since || !until)
    return res.status(400).json({ error: "ต้องส่ง account_id, since, until" });
  const fields = "spend,impressions,reach,clicks,ctr,cpm,cpc";
  const url = `https://graph.facebook.com/v19.0/act_${account_id}/insights`
    + `?fields=${fields}&breakdowns=age,gender`
    + `&time_range={"since":"${since}","until":"${until}"}`
    + `&level=account&limit=200&access_token=${TOKEN}`;
  try {
    const { default: fetch } = await import("node-fetch");
    const data = await (await fetch(url)).json();
    if (data.error) return res.status(400).json(data.error);
    res.json({ data:(data.data||[]).map(r=>({age:r.age,gender:r.gender,
      spend:parseFloat(r.spend||0),impressions:parseInt(r.impressions||0),
      reach:parseInt(r.reach||0),clicks:parseInt(r.clicks||0),
      ctr:parseFloat(r.ctr||0),cpm:parseFloat(r.cpm||0),cpc:parseFloat(r.cpc||0)}))});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/regions", async (req, res) => {
  const { account_id, since, until } = req.query;
  if (!account_id || !since || !until)
    return res.status(400).json({ error: "ต้องส่ง account_id, since, until" });
  const fields = "spend,impressions,reach,clicks,ctr,cpm";
  const url = `https://graph.facebook.com/v19.0/act_${account_id}/insights`
    + `?fields=${fields}&breakdowns=region`
    + `&time_range={"since":"${since}","until":"${until}"}`
    + `&level=account&limit=200&access_token=${TOKEN}`;
  try {
    const { default: fetch } = await import("node-fetch");
    const data = await (await fetch(url)).json();
    if (data.error) return res.status(400).json(data.error);
    res.json({ data:(data.data||[]).map(r=>({region:r.region,spend:parseFloat(r.spend||0),
      impressions:parseInt(r.impressions||0),reach:parseInt(r.reach||0),
      clicks:parseInt(r.clicks||0),ctr:parseFloat(r.ctr||0),cpm:parseFloat(r.cpm||0)}))});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Ad Set Statistics (gender breakdown) ─────────────────────────────────
app.get("/api/adsets", async (req, res) => {
  const { account_id, since, until } = req.query;
  if (!account_id || !since || !until)
    return res.status(400).json({ error: "ต้องส่ง account_id, since, until" });

  const fields = "spend,impressions,reach,actions";
  const url = `https://graph.facebook.com/v19.0/act_${account_id}/insights`
    + `?fields=${fields}&breakdowns=gender`
    + `&time_range={"since":"${since}","until":"${until}"}`
    + `&level=account&limit=200&access_token=${TOKEN}`;

  try {
    const { default: fetch } = await import("node-fetch");
    const data = await (await fetch(url)).json();
    if (data.error) return res.status(400).json(data.error);

    const genderMap = {};
    (data.data || []).forEach(r => {
      const gender = r.gender || "unknown";
      if (gender === "unknown") return;
      if (!genderMap[gender]) {
        genderMap[gender] = { gender, spend:0, impressions:0, reach:0, messages:0 };
      }
      const msg = (r.actions||[]).find(a=>
        a.action_type==="onsite_conversion.messaging_conversation_started_7d");
      genderMap[gender].spend       += parseFloat(r.spend||0);
      genderMap[gender].impressions += parseInt(r.impressions||0);
      genderMap[gender].reach       += parseInt(r.reach||0);
      genderMap[gender].messages    += msg ? parseInt(msg.value) : 0;
    });

    res.json({ data: Object.values(genderMap) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Ad Set Names — ดึงชื่อกลุ่มเป้าหมายพร้อมสถิติ รวมชื่อซ้ำ ─────────────
app.get("/api/adset-names", async (req, res) => {
  const { account_id, since, until } = req.query;
  if (!account_id || !since || !until)
    return res.status(400).json({ error: "ต้องส่ง account_id, since, until" });

  const fields = "adset_name,spend,impressions,reach,clicks,actions";
  const url = `https://graph.facebook.com/v19.0/act_${account_id}/insights`
    + `?fields=${fields}`
    + `&time_range={"since":"${since}","until":"${until}"}`
    + `&level=adset&limit=500&access_token=${TOKEN}`;

  try {
    const { default: fetch } = await import("node-fetch");
    const data = await (await fetch(url)).json();
    if (data.error) return res.status(400).json(data.error);

    // รวมชื่อซ้ำกัน
    const map = {};
    (data.data || []).forEach(r => {
      const name = r.adset_name || "ไม่มีชื่อ";
      if (!map[name]) {
        map[name] = { name, spend:0, impressions:0, reach:0, clicks:0, messages:0 };
      }
      const msg = (r.actions||[]).find(a=>
        a.action_type==="onsite_conversion.messaging_conversation_started_7d");
      map[name].spend       += parseFloat(r.spend||0);
      map[name].impressions += parseInt(r.impressions||0);
      map[name].reach       += parseInt(r.reach||0);
      map[name].clicks      += parseInt(r.clicks||0);
      map[name].messages    += msg ? parseInt(msg.value) : 0;
    });

    // คำนวณ cpm, cpc, ctr
    const rows = Object.values(map).map(r => ({
      ...r,
      cpm: r.impressions > 0 ? parseFloat((r.spend / r.impressions * 1000).toFixed(2)) : 0,
      cpc: r.clicks > 0      ? parseFloat((r.spend / r.clicks).toFixed(2)) : 0,
      ctr: r.impressions > 0 ? parseFloat((r.clicks / r.impressions * 100).toFixed(2)) : 0,
      cpmsg: r.messages > 0  ? parseFloat((r.spend / r.messages).toFixed(2)) : 0,
    }));

    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
