// components/KpiGrid.jsx
// Props: campaigns[], ads[], budget, onBudgetChange
import { fmt } from "../utils/format";

export default function KpiGrid({ campaigns, ads, budget, onBudgetChange }) {
  const spend       = campaigns.reduce((s,c) => s + c.spend, 0);
  const reach       = campaigns.reduce((s,c) => s + c.reach, 0);
  const impressions = campaigns.reduce((s,c) => s + c.impressions, 0);
  const clicks      = campaigns.reduce((s,c) => s + c.clicks, 0);
  const messages    = campaigns.reduce((s,c) => s + (c.messages ?? 0), 0);
  const remaining   = budget > 0 ? budget - spend : null;
  const cpr         = reach > 0       ? (spend / reach) * 1000 : 0;
  const cpm         = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const cpc         = clicks > 0      ? spend / clicks : 0;
  const cpm_msg     = messages > 0    ? spend / messages : 0;

  const cards = [
    { label:"ยอดใช้จ่าย",             val: fmt.thb(spend),        sub: budget > 0 ? `งบ ${fmt.thb(budget)}` : "—", color:"var(--blue)"  },
    { label:"งบคงเหลือ",              val: remaining !== null ? fmt.thb(remaining) : "ยังไม่ได้กำหนดงบ", sub: budget > 0 ? `${((spend/budget)*100).toFixed(1)}% ของงบ` : "", color: remaining !== null && remaining < 0 ? "var(--red)" : "var(--green)" },
    { label:"ผู้คน",                  val: fmt.reach(reach),       sub:"unique users",            color:"var(--teal)"  },
    { label:"แสดงโฆษณา",              val: fmt.reach(impressions), sub:"total impressions",        color:"var(--amber)" },
    { label:"คลิก",                   val: fmt.num(clicks),        sub:"total clicks",             color:"var(--blue)"  },
    { label:"ข้อความ",                val: messages > 0 ? fmt.num(messages) : "—", sub:"conversations started", color:"var(--teal)" },
    { label:"ต้นทุนต่อ 1,000 ผู้คน", val: fmt.thb(cpr),           sub:"cost per 1K reach",        color:"var(--amber)" },
    { label:"ต้นทุนต่อ 1,000 แสดง",  val: fmt.thb(cpm),           sub:"cost per 1K impressions",  color:"var(--amber)" },
    { label:"ต้นทุนต่อคลิก",         val: fmt.thb(cpc),           sub:"cost per click",           color:"var(--blue)"  },
    { label:"ต้นทุนต่อข้อความ",      val: messages > 0 ? fmt.thb(cpm_msg) : "—", sub:"cost per message", color:"var(--teal)" },
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
            <div className="kpi-val" style={{ color: c.color }}>{c.val}</div>
            <div className="kpi-sub">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
