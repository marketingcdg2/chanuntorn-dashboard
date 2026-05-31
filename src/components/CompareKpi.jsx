// components/CompareKpi.jsx
// Props: campaigns[], prevCampaigns[], ads[], prevAds[], budget, onBudgetChange
import { fmt } from "../utils/format";

function delta(cur, prev) {
  if (!prev || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}
function DeltaBadge({ cur, prev }) {
  const pct = delta(cur, prev);
  if (pct === null) return null;
  const up = pct >= 0;
  return <span className={`delta-badge ${up?"up":"down"}`}>{up?"▲":"▼"} {Math.abs(pct).toFixed(1)}%</span>;
}

export default function CompareKpi({ campaigns, prevCampaigns, ads, prevAds, budget, onBudgetChange }) {
  const calc = (camps, adsList) => {
    const spend       = camps.reduce((s,c) => s + c.spend, 0);
    const reach       = camps.reduce((s,c) => s + c.reach, 0);
    const impressions = camps.reduce((s,c) => s + c.impressions, 0);
    const clicks      = camps.reduce((s,c) => s + c.clicks, 0);
    const messages    = camps.reduce((s,c) => s + (c.messages ?? 0), 0);
    const cpr   = reach > 0       ? (spend / reach) * 1000 : 0;
    const cpm   = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const cpc   = clicks > 0      ? spend / clicks : 0;
    const cpmsg = messages > 0    ? spend / messages : 0;
    return { spend, reach, impressions, clicks, messages, cpr, cpm, cpc, cpmsg };
  };

  const cur  = calc(campaigns,     ads     ?? []);
  const prev = calc(prevCampaigns, prevAds ?? []);
  const remaining = budget > 0 ? budget - cur.spend : null;

  const cards = [
    { label:"ยอดใช้จ่าย",             cur:cur.spend,       prev:prev.spend,       val:fmt.thb(cur.spend),        sub: budget > 0 ? `งบ ${fmt.thb(budget)}` : "—",   color:"var(--blue)"  },
    { label:"งบคงเหลือ",              cur:remaining??0,    prev:null,             val:remaining!==null ? fmt.thb(remaining) : "ยังไม่ได้กำหนดงบ", sub: budget>0 ? `${((cur.spend/budget)*100).toFixed(1)}% ของงบ` : "", color:remaining!==null&&remaining<0?"var(--red)":"var(--green)" },
    { label:"ผู้คน",                  cur:cur.reach,       prev:prev.reach,       val:fmt.reach(cur.reach),      sub:"unique users",            color:"var(--teal)"  },
    { label:"แสดงโฆษณา",              cur:cur.impressions, prev:prev.impressions, val:fmt.reach(cur.impressions),sub:"total impressions",        color:"var(--amber)" },
    { label:"คลิก",                   cur:cur.clicks,      prev:prev.clicks,      val:fmt.num(cur.clicks),       sub:"total clicks",             color:"var(--blue)"  },
    { label:"ข้อความ",                cur:cur.messages,    prev:prev.messages,    val:cur.messages>0 ? fmt.num(cur.messages) : "—", sub:"conversations started", color:"var(--teal)" },
    { label:"ต้นทุนต่อ 1,000 ผู้คน", cur:cur.cpr,         prev:prev.cpr,         val:fmt.thb(cur.cpr),          sub:"cost per 1K reach",        color:"var(--amber)" },
    { label:"ต้นทุนต่อ 1,000 แสดง",  cur:cur.cpm,         prev:prev.cpm,         val:fmt.thb(cur.cpm),          sub:"cost per 1K impressions",  color:"var(--amber)" },
    { label:"ต้นทุนต่อคลิก",         cur:cur.cpc,         prev:prev.cpc,         val:fmt.thb(cur.cpc),          sub:"cost per click",           color:"var(--blue)"  },
    { label:"ต้นทุนต่อข้อความ",      cur:cur.cpmsg,       prev:prev.cpmsg,       val:cur.messages>0 ? fmt.thb(cur.cpmsg) : "—", sub:"cost per message", color:"var(--teal)" },
  ];

  return (
    <div className="kpi-section">
      <div className="budget-row">
        <label className="budget-label">งบประมาณเดือนนี้</label>
        <div className="budget-input-wrap">
          <span className="budget-prefix">฿</span>
          <input type="number" className="budget-input" placeholder="กรอกงบประมาณ"
            value={budget || ""} onChange={e => onBudgetChange(e.target.value)} />
        </div>
      </div>
      <div className="kpi-grid-5">
        {cards.map(c => (
          <div key={c.label} className="card kpi-card">
            <div className="kpi-label">{c.label}</div>
            <div className="kpi-val" style={{ color:c.color }}>{c.val}</div>
            <div className="compare-row">
              <span className="kpi-sub">{c.sub}</span>
              {c.prev !== null && <DeltaBadge cur={c.cur} prev={c.prev} />}
            </div>
            {c.prev !== null && prev.spend > 0 && (
              <div className="kpi-prev">ก่อนหน้า: {
                c.label==="ผู้คน"       ? fmt.reach(c.prev) :
                c.label==="แสดงโฆษณา"  ? fmt.reach(c.prev) :
                c.label==="คลิก"        ? fmt.num(c.prev)   :
                c.label==="ข้อความ"     ? (c.prev>0 ? fmt.num(c.prev) : "—") :
                fmt.thb(c.prev)
              }</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
