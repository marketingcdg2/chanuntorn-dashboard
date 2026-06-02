// components/AudienceTable.jsx
// Props: audience[]
import { useState } from "react";
import { fmt } from "../utils/format";

const AGE_ORDER = ["18-24","25-34","35-44","45-54","55-64","65+"];
const GENDER_LABEL = { female:"หญิง", male:"ชาย" };
const GENDER_COLOR = { female:"var(--teal)", male:"var(--blue)" };

export default function AudienceTable({ audience }) {
  const [view, setView] = useState("age"); // "age" | "gender" | "detail"

  if (!audience?.length) return null;

  const clean = audience.filter(r => r.gender !== "unknown");
  const totalImp = clean.reduce((s,r) => s + r.impressions, 0);
  const totalSpend = clean.reduce((s,r) => s + r.spend, 0);
  const totalReach = clean.reduce((s,r) => s + r.reach, 0);
  const totalClicks = clean.reduce((s,r) => s + r.clicks, 0);

  // by age
  const byAge = AGE_ORDER.map(age => {
    const rows = clean.filter(r => r.age === age);
    if (!rows.length) return null;
    const spend      = rows.reduce((s,r) => s + r.spend, 0);
    const impressions= rows.reduce((s,r) => s + r.impressions, 0);
    const reach      = rows.reduce((s,r) => s + r.reach, 0);
    const clicks     = rows.reduce((s,r) => s + r.clicks, 0);
    const ctr        = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpm        = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const cpc        = clicks > 0 ? spend / clicks : 0;
    const pct        = totalImp > 0 ? (impressions / totalImp * 100).toFixed(1) : 0;
    return { age, spend, impressions, reach, clicks, ctr, cpm, cpc, pct };
  }).filter(Boolean);

  // by gender
  const byGender = ["female","male"].map(gender => {
    const rows = clean.filter(r => r.gender === gender);
    if (!rows.length) return null;
    const spend      = rows.reduce((s,r) => s + r.spend, 0);
    const impressions= rows.reduce((s,r) => s + r.impressions, 0);
    const reach      = rows.reduce((s,r) => s + r.reach, 0);
    const clicks     = rows.reduce((s,r) => s + r.clicks, 0);
    const ctr        = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpm        = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const cpc        = clicks > 0 ? spend / clicks : 0;
    const pct        = totalImp > 0 ? (impressions / totalImp * 100).toFixed(1) : 0;
    return { gender, spend, impressions, reach, clicks, ctr, cpm, cpc, pct };
  }).filter(Boolean);

  // detail age x gender
  const detail = AGE_ORDER.flatMap(age =>
    ["female","male"].map(gender => {
      const row = clean.find(r => r.age === age && r.gender === gender);
      if (!row) return null;
      const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
      const cpm = row.impressions > 0 ? (row.spend / row.impressions) * 1000 : 0;
      const cpc = row.clicks > 0 ? row.spend / row.clicks : 0;
      const pct = totalImp > 0 ? (row.impressions / totalImp * 100).toFixed(1) : 0;
      return { ...row, ctr, cpm, cpc, pct };
    })
  ).filter(Boolean);

  const TABS = [
    { key:"age",    label:"ตามช่วงอายุ" },
    { key:"gender", label:"ตามเพศ"      },
    { key:"detail", label:"อายุ × เพศ"  },
  ];

  return (
    <>
      <p className="section-label">กลุ่มเป้าหมาย — สรุปประสิทธิภาพ</p>
      <div className="card" style={{ padding:0, overflow:"hidden" }}>

        {/* tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid var(--border)", padding:"0 16px" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setView(t.key)}
              style={{
                padding:"10px 16px", border:"none", background:"none",
                cursor:"pointer", fontSize:"13px", fontWeight: view===t.key ? 600 : 400,
                color: view===t.key ? "var(--blue)" : "var(--muted)",
                borderBottom: view===t.key ? "2px solid var(--blue)" : "2px solid transparent",
                marginBottom:"-1px",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ overflowX:"auto" }}>
          <table className="region-table">
            <thead>
              <tr>
                {view === "age" && <>
                  <th>ช่วงอายุ</th><th>สัดส่วน</th><th>Spend</th>
                  <th>Reach</th><th>แสดงโฆษณา</th><th>คลิก</th>
                  <th>CTR</th><th>CPM</th><th>CPC</th>
                </>}
                {view === "gender" && <>
                  <th>เพศ</th><th>สัดส่วน</th><th>Spend</th>
                  <th>Reach</th><th>แสดงโฆษณา</th><th>คลิก</th>
                  <th>CTR</th><th>CPM</th><th>CPC</th>
                </>}
                {view === "detail" && <>
                  <th>ช่วงอายุ</th><th>เพศ</th><th>สัดส่วน</th><th>Spend</th>
                  <th>Reach</th><th>แสดงโฆษณา</th><th>คลิก</th>
                  <th>CTR</th><th>CPM</th>
                </>}
              </tr>
            </thead>
            <tbody>

              {view === "age" && byAge.map(r => (
                <tr key={r.age} className="region-row" style={{ cursor:"default" }}>
                  <td style={{ fontWeight:600 }}>{r.age}</td>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                      <div style={{ width:"60px", height:"6px", borderRadius:"3px", background:"var(--surface2)" }}>
                        <div style={{ width:`${r.pct}%`, height:"100%", borderRadius:"3px", background:"var(--blue)" }} />
                      </div>
                      <span className="mono" style={{ fontSize:"12px", color:"var(--muted)" }}>{r.pct}%</span>
                    </div>
                  </td>
                  <td className="mono">{fmt.thb(r.spend)}</td>
                  <td className="mono">{fmt.num(r.reach)}</td>
                  <td className="mono">{fmt.num(r.impressions)}</td>
                  <td className="mono">{fmt.num(r.clicks)}</td>
                  <td className="mono" style={{ color: r.ctr > 3 ? "var(--teal)" : "inherit" }}>{r.ctr.toFixed(2)}%</td>
                  <td className="mono" style={{ color: r.cpm > 200 ? "var(--red)" : r.cpm > 50 ? "var(--amber)" : "var(--teal)" }}>{fmt.thb(r.cpm)}</td>
                  <td className="mono">{fmt.thb(r.cpc)}</td>
                </tr>
              ))}

              {view === "gender" && byGender.map(r => (
                <tr key={r.gender} className="region-row" style={{ cursor:"default" }}>
                  <td style={{ fontWeight:700, color: GENDER_COLOR[r.gender] }}>
                    {GENDER_LABEL[r.gender]}
                  </td>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                      <div style={{ width:"60px", height:"6px", borderRadius:"3px", background:"var(--surface2)" }}>
                        <div style={{ width:`${r.pct}%`, height:"100%", borderRadius:"3px", background: GENDER_COLOR[r.gender] }} />
                      </div>
                      <span className="mono" style={{ fontSize:"12px", color:"var(--muted)" }}>{r.pct}%</span>
                    </div>
                  </td>
                  <td className="mono">{fmt.thb(r.spend)}</td>
                  <td className="mono">{fmt.num(r.reach)}</td>
                  <td className="mono">{fmt.num(r.impressions)}</td>
                  <td className="mono">{fmt.num(r.clicks)}</td>
                  <td className="mono" style={{ color: r.ctr > 3 ? "var(--teal)" : "inherit" }}>{r.ctr.toFixed(2)}%</td>
                  <td className="mono" style={{ color: r.cpm > 200 ? "var(--red)" : r.cpm > 50 ? "var(--amber)" : "var(--teal)" }}>{fmt.thb(r.cpm)}</td>
                  <td className="mono">{fmt.thb(r.cpc)}</td>
                </tr>
              ))}

              {view === "detail" && detail.map(r => (
                <tr key={r.age+r.gender} className="region-row" style={{ cursor:"default" }}>
                  <td style={{ fontWeight:600 }}>{r.age}</td>
                  <td style={{ fontWeight:700, color: GENDER_COLOR[r.gender] }}>
                    {GENDER_LABEL[r.gender]}
                  </td>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                      <div style={{ width:"50px", height:"6px", borderRadius:"3px", background:"var(--surface2)" }}>
                        <div style={{ width:`${r.pct}%`, height:"100%", borderRadius:"3px", background: GENDER_COLOR[r.gender] }} />
                      </div>
                      <span className="mono" style={{ fontSize:"12px", color:"var(--muted)" }}>{r.pct}%</span>
                    </div>
                  </td>
                  <td className="mono">{fmt.thb(r.spend)}</td>
                  <td className="mono">{fmt.num(r.reach)}</td>
                  <td className="mono">{fmt.num(r.impressions)}</td>
                  <td className="mono">{fmt.num(r.clicks)}</td>
                  <td className="mono" style={{ color: r.ctr > 3 ? "var(--teal)" : "inherit" }}>{r.ctr.toFixed(2)}%</td>
                  <td className="mono" style={{ color: r.cpm > 200 ? "var(--red)" : r.cpm > 50 ? "var(--amber)" : "var(--teal)" }}>{fmt.thb(r.cpm)}</td>
                </tr>
              ))}

            </tbody>

            {/* แถวรวม */}
            <tfoot>
              <tr style={{ borderTop:"2px solid var(--border)", background:"var(--surface2)" }}>
                {view === "detail"
                  ? <><td colSpan={2} style={{ fontWeight:700 }}>รวม</td><td></td></>
                  : <><td style={{ fontWeight:700 }}>รวม</td><td></td></>
                }
                <td className="mono" style={{ fontWeight:700 }}>{fmt.thb(totalSpend)}</td>
                <td className="mono" style={{ fontWeight:700 }}>{fmt.num(totalReach)}</td>
                <td className="mono" style={{ fontWeight:700 }}>{fmt.num(totalImp)}</td>
                <td className="mono" style={{ fontWeight:700 }}>{fmt.num(totalClicks)}</td>
                <td className="mono" style={{ fontWeight:700 }}>
                  {totalImp > 0 ? (totalClicks/totalImp*100).toFixed(2) : 0}%
                </td>
                <td className="mono" style={{ fontWeight:700 }}>
                  {totalImp > 0 ? fmt.thb(totalSpend/totalImp*1000) : "—"}
                </td>
                {view !== "detail" && (
                  <td className="mono" style={{ fontWeight:700 }}>
                    {totalClicks > 0 ? fmt.thb(totalSpend/totalClicks) : "—"}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
