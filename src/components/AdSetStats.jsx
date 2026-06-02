// components/AdSetStats.jsx — ตาราง Ad Sets แบบ Facebook Ads Manager
import { useState } from "react";
import { fmt } from "../utils/format";

const GENDER_LABEL = { female:"หญิง", male:"ชาย" };
const GENDER_COLOR = { female:"var(--teal)", male:"var(--blue)" };

export default function AdSetStats({ adsets }) {
  const [view, setView] = useState("summary"); // "summary" | "gender"

  if (!adsets?.length) return null;

  const total = {
    spend:       adsets.reduce((s,r) => s + r.spend, 0),
    impressions: adsets.reduce((s,r) => s + r.impressions, 0),
    reach:       adsets.reduce((s,r) => s + r.reach, 0),
    messages:    adsets.reduce((s,r) => s + r.messages, 0),
  };

  const clean = adsets.filter(r => r.gender !== "unknown");

  return (
    <>
      <p className="section-label">Ad Sets</p>
      <div className="card" style={{ padding:0, overflow:"hidden" }}>

        {/* tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid var(--border)", padding:"0 16px" }}>
          {[
            { key:"summary", label:"ภาพรวม" },
            { key:"gender",  label:"แบ่งตามเพศ" },
          ].map(t => (
            <button key={t.key} onClick={() => setView(t.key)}
              style={{
                padding:"10px 16px", border:"none", background:"none",
                cursor:"pointer", fontSize:"13px",
                fontWeight: view===t.key ? 600 : 400,
                color: view===t.key ? "var(--blue)" : "var(--muted)",
                borderBottom: view===t.key ? "2px solid var(--blue)" : "2px solid transparent",
                marginBottom:"-1px",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <table className="region-table">
          <thead>
            <tr>
              {view === "summary" ? <>
                <th>Ad Set</th>
                <th>Spend</th>
                <th>Reach</th>
                <th>แสดงโฆษณา</th>
                <th>ข้อความ</th>
                <th>สัดส่วน Spend</th>
              </> : <>
                <th>เพศ</th>
                <th>Spend</th>
                <th>Reach</th>
                <th>แสดงโฆษณา</th>
                <th>ข้อความ</th>
                <th>สัดส่วน Spend</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {view === "summary" && (
              <tr className="region-row" style={{ cursor:"default" }}>
                <td style={{ fontWeight:600 }}>ทั้งหมด</td>
                <td className="mono">{fmt.thb(total.spend)}</td>
                <td className="mono">{fmt.num(total.reach)}</td>
                <td className="mono">{fmt.num(total.impressions)}</td>
                <td className="mono" style={{ color:"var(--green)" }}>
                  {total.messages > 0 ? fmt.num(total.messages) : "—"}
                </td>
                <td>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                    <div style={{ width:"80px", height:"6px", borderRadius:"3px", background:"var(--surface2)" }}>
                      <div style={{ width:"100%", height:"100%", borderRadius:"3px", background:"var(--blue)" }} />
                    </div>
                    <span style={{ fontSize:"12px", color:"var(--muted)" }}>100%</span>
                  </div>
                </td>
              </tr>
            )}

            {view === "gender" && clean
              .sort((a,b) => b.spend - a.spend)
              .map(r => {
                const pct = total.spend > 0 ? (r.spend / total.spend * 100).toFixed(1) : 0;
                return (
                  <tr key={r.gender} className="region-row" style={{ cursor:"default" }}>
                    <td style={{ fontWeight:700, color: GENDER_COLOR[r.gender] ?? "var(--muted)" }}>
                      {GENDER_LABEL[r.gender] ?? r.gender}
                    </td>
                    <td className="mono">{fmt.thb(r.spend)}</td>
                    <td className="mono">{fmt.num(r.reach)}</td>
                    <td className="mono">{fmt.num(r.impressions)}</td>
                    <td className="mono" style={{ color:"var(--green)" }}>
                      {r.messages > 0 ? fmt.num(r.messages) : "—"}
                    </td>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                        <div style={{ width:"80px", height:"6px", borderRadius:"3px", background:"var(--surface2)" }}>
                          <div style={{ width:`${pct}%`, height:"100%", borderRadius:"3px", background: GENDER_COLOR[r.gender] ?? "var(--blue)" }} />
                        </div>
                        <span style={{ fontSize:"12px", color:"var(--muted)" }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            }
          </tbody>

          {/* แถวรวม */}
          <tfoot>
            <tr style={{ borderTop:"2px solid var(--border)", background:"var(--surface2)" }}>
              <td style={{ fontWeight:700, fontSize:"13px" }}>รวม</td>
              <td className="mono" style={{ fontWeight:700 }}>{fmt.thb(total.spend)}</td>
              <td className="mono" style={{ fontWeight:700 }}>{fmt.num(total.reach)}</td>
              <td className="mono" style={{ fontWeight:700 }}>{fmt.num(total.impressions)}</td>
              <td className="mono" style={{ fontWeight:700, color:"var(--green)" }}>
                {total.messages > 0 ? fmt.num(total.messages) : "—"}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
