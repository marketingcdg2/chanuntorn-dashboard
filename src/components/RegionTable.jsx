// components/RegionTable.jsx
// Props: regions[], audience[], campaigns[]
import { useState } from "react";
import { fmt } from "../utils/format";

const AGE_ORDER = ["18-24","25-34","35-44","45-54","55-64","65+"];

// คำนวณค่าประมาณตาม proportion impressions ของจังหวัด
function calcShare(regionImp, totalImp, audience, totalMsg) {
  const ratio = totalImp > 0 ? regionImp / totalImp : 0;
  return audience
    .filter(r => r.gender !== "unknown")
    .map(r => ({
      ...r,
      impressions: Math.round(r.impressions * ratio),
      reach:       Math.round(r.reach * ratio),
      spend:       parseFloat((r.spend * ratio).toFixed(2)),
      msgEst:      Math.round(totalMsg * ratio *
                     (r.impressions / (audience.reduce((s,x)=>s+x.impressions,0)||1))),
    }))
    .filter(r => r.impressions > 0);
}

const COLS = [
  { key:"region",      label:"จังหวัด",    fmt: v => v  },
  { key:"spend",       label:"Spend",      fmt: v => fmt.thb(v) },
  { key:"reach",       label:"Reach",      fmt: v => fmt.num(v) },
  { key:"messages",    label:"ข้อความ",    fmt: v => v > 0 ? fmt.num(v) : "—" },
];

export default function RegionTable({ regions, audience, campaigns }) {
  const [expanded, setExpanded] = useState(null);
  const [sortKey,  setSortKey]  = useState(null);
  const [sortDir,  setSortDir]  = useState("desc");

  if (!regions?.length) return null;

  const totalImp = regions.reduce((s,r) => s + r.impressions, 0);
  const totalMsg = (campaigns || []).reduce((s,c) => s + (c.messages ?? 0), 0);

  // เพิ่ม messages ประมาณตาม proportion impressions
  const withMsg = regions
    .filter(r => r.region !== "Unknown")
    .map(r => ({
      ...r,
      messages: totalImp > 0 ? Math.round((r.impressions / totalImp) * totalMsg) : 0,
    }));

  // sort
  const sorted = sortKey
    ? [...withMsg].sort((a,b) => {
        const av = a[sortKey] ?? 0;
        const bv = b[sortKey] ?? 0;
        if (typeof av === "string") return sortDir==="asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        return sortDir === "asc" ? av - bv : bv - av;
      })
    : withMsg;

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function sortIcon(key) {
    if (sortKey !== key) return <span style={{ color:"var(--border2)", marginLeft:4 }}>⇅</span>;
    return <span style={{ color:"var(--blue)", marginLeft:4 }}>{sortDir==="asc"?"↑":"↓"}</span>;
  }

  return (
    <>
      <p className="section-label">Location — จังหวัด × อายุ × เพศ</p>
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <table className="region-table">
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.key}
                  style={{ cursor:"pointer", userSelect:"none" }}
                  onClick={() => toggleSort(c.key)}>
                  {c.label}{sortIcon(c.key)}
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <>
                <tr key={r.region}
                  className={`region-row ${expanded===r.region?"expanded":""}`}
                  onClick={() => setExpanded(expanded===r.region ? null : r.region)}>
                  <td className="region-name">{r.region}</td>
                  <td className="mono">{fmt.thb(r.spend)}</td>
                  <td className="mono">{fmt.num(r.reach)}</td>
                  <td className="mono">{r.messages > 0 ? fmt.num(r.messages) : "—"}</td>
                  <td className="expand-icon">{expanded===r.region?"▲":"▼"}</td>
                </tr>

                {expanded===r.region && (
                  <tr key={r.region+"_d"} className="detail-row">
                    <td colSpan={5} style={{ padding:0 }}>
                      <div className="detail-wrap">
                        <table className="detail-table">
                          <thead>
                            <tr><th>อายุ</th><th>เพศ</th><th>Spend (est.)</th><th>Reach (est.)</th><th>ข้อความ (est.)</th></tr>
                          </thead>
                          <tbody>
                            {AGE_ORDER.map(age =>
                              ["female","male"].map(gender => {
                                const row = calcShare(r.impressions, totalImp, audience, totalMsg)
                                  .find(d => d.age===age && d.gender===gender);
                                if (!row) return null;
                                return (
                                  <tr key={age+gender}>
                                    <td>{row.age}</td>
                                    <td style={{ color:gender==="female"?"var(--teal)":"var(--blue)" }}>
                                      {gender==="female"?"หญิง":"ชาย"}
                                    </td>
                                    <td className="mono">{fmt.thb(row.spend)}</td>
                                    <td className="mono">{fmt.num(row.reach)}</td>
                                    <td className="mono">{row.msgEst > 0 ? fmt.num(row.msgEst) : "—"}</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                        <p className="detail-note">* ค่าประมาณตามสัดส่วน impressions ของจังหวัด</p>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
