// components/AgeGenderCharts.jsx
import { useState } from "react";
import { fmt } from "../utils/format";

const AGE_ORDER = ["18-24","25-34","35-44","45-54","55-64","65+"];

export default function AgeGenderCharts({ audience, campaigns }) {
  const [popup, setPopup] = useState(null);
  if (!audience?.length) return null;

  const totalImp = audience.reduce((s,r) => s + r.impressions, 0);
  const totalMsg = (campaigns ?? []).reduce((s,c) => s + (c.messages ?? 0), 0);

  // by age — คำนวณ msgEst ตาม proportion impressions
  const byAge = AGE_ORDER.map(age => {
    const rows   = audience.filter(r => r.age === age);
    const imp    = rows.reduce((s,r) => s + r.impressions, 0);
    const reach  = rows.reduce((s,r) => s + r.reach, 0);
    const msgEst = totalImp > 0 ? Math.round((imp / totalImp) * totalMsg) : 0;
    return { age, impressions:imp, reach, messages:msgEst,
      pct: totalImp > 0 ? (imp/totalImp*100).toFixed(1) : 0 };
  }).filter(r => r.impressions > 0);

  const maxImp = Math.max(...byAge.map(r => r.impressions));

  // by gender donut
  const female  = audience.filter(r => r.gender==="female").reduce((s,r)=>s+r.impressions,0);
  const male    = audience.filter(r => r.gender==="male").reduce((s,r)=>s+r.impressions,0);
  const gTotal  = female + male;
  const fPct    = gTotal > 0 ? (female/gTotal*100).toFixed(1) : 0;
  const mPct    = gTotal > 0 ? (male/gTotal*100).toFixed(1)   : 0;
  const fMsgEst = gTotal > 0 ? Math.round((female/gTotal)*totalMsg) : 0;
  const mMsgEst = gTotal > 0 ? Math.round((male/gTotal)*totalMsg)   : 0;

  // popup — แบ่ง messages ของช่วงอายุนั้นตาม proportion impressions ของแต่ละเพศ
  function openPopup(age) {
    const ageRows     = audience.filter(r => r.age === age && r.gender !== "unknown");
    const ageImpTotal = ageRows.reduce((s,r) => s + r.impressions, 0);
    const ageMsgTotal = byAge.find(r => r.age === age)?.messages ?? 0; // ใช้ข้อความของช่วงอายุนี้
    const items = ageRows.map(r => ({
      ...r,
      genderLabel: r.gender==="female" ? "หญิง" : "ชาย",
      msgEst: ageImpTotal > 0 ? Math.round((r.impressions / ageImpTotal) * ageMsgTotal) : 0,
    }));
    setPopup({ age, items });
  }

  return (
    <>
      <p className="section-label">Audience — การนำส่งทั้งหมด</p>
      <div className="grid-2">

        {/* กราฟอายุ */}
        <div className="card">
          <div className="card-title">แสดงโฆษณา แบ่งตามช่วงอายุ</div>
          {byAge.map(r => (
            <div key={r.age} className="bar-row clickable" onClick={() => openPopup(r.age)} title="คลิกดูรายละเอียด">
              <span className="bar-label">{r.age}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width:`${(r.impressions/maxImp*100).toFixed(1)}%`, background:"var(--blue)" }} />
              </div>
              <span className="bar-val" style={{ color:"var(--blue)" }}>{fmt.reach(r.impressions)}</span>
              <span className="bar-pct">{r.pct}%</span>
              <span className="bar-msg" title="ข้อความ (ประมาณ)">{r.messages > 0 ? `💬${r.messages}` : "—"}</span>
            </div>
          ))}
          <p className="chart-hint">คลิกช่วงอายุเพื่อดูรายละเอียด</p>
        </div>

        {/* donut เพศ */}
        <div className="card">
          <div className="card-title">แสดงโฆษณา แบ่งตามเพศ</div>
          <div className="donut-wrap">
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface2)" strokeWidth="20"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--teal)" strokeWidth="20"
                strokeDasharray={`${fPct*3.14159} ${(100-Number(fPct))*3.14159}`}
                strokeDashoffset="78.54" transform="rotate(-90 60 60)"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--blue)" strokeWidth="20"
                strokeDasharray={`${mPct*3.14159} ${(100-Number(mPct))*3.14159}`}
                strokeDashoffset={`${78.54-(Number(fPct)*3.14159)}`} transform="rotate(-90 60 60)"/>
            </svg>
            <div className="donut-legend">
              <div className="leg-item">
                <span className="leg-dot" style={{ background:"var(--teal)" }}/>
                <span>หญิง</span>
                <span className="leg-val" style={{ color:"var(--teal)" }}>{fPct}% · {fmt.reach(female)}</span>
              </div>
              <div style={{ color:"var(--muted)", fontSize:"11px", marginLeft:"18px", marginBottom:"8px" }}>
                💬 {fMsgEst > 0 ? fmt.num(fMsgEst) : "—"} ข้อความ (ประมาณ)
              </div>
              <div className="leg-item">
                <span className="leg-dot" style={{ background:"var(--blue)" }}/>
                <span>ชาย</span>
                <span className="leg-val" style={{ color:"var(--blue)" }}>{mPct}% · {fmt.reach(male)}</span>
              </div>
              <div style={{ color:"var(--muted)", fontSize:"11px", marginLeft:"18px" }}>
                💬 {mMsgEst > 0 ? fmt.num(mMsgEst) : "—"} ข้อความ (ประมาณ)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup */}
      {popup && (
        <div className="popup-overlay" onClick={() => setPopup(null)}>
          <div className="popup-box" onClick={e => e.stopPropagation()}>
            <div className="popup-header">
              <span>ช่วงอายุ {popup.age}</span>
              <button className="popup-close" onClick={() => setPopup(null)}>✕</button>
            </div>
            <table className="detail-table" style={{ width:"100%" }}>
              <thead>
                <tr><th>เพศ</th><th>Spend</th><th>Reach</th><th>แสดงโฆษณา</th><th>ข้อความ (ประมาณ)</th></tr>
              </thead>
              <tbody>
                {popup.items.map(r => (
                  <tr key={r.genderLabel}>
                    <td style={{ color:r.gender==="female"?"var(--teal)":"var(--blue)" }}>{r.genderLabel}</td>
                    <td className="mono">{fmt.thb(r.spend)}</td>
                    <td className="mono">{fmt.num(r.reach)}</td>
                    <td className="mono">{fmt.num(r.impressions)}</td>
                    <td className="mono" style={{ color:"var(--green)" }}>{r.msgEst > 0 ? fmt.num(r.msgEst) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
