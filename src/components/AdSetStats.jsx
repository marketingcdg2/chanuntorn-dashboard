// components/AdSetStats.jsx — ตารางชื่อกลุ่มเป้าหมาย พร้อม drill-down
import { useState } from "react";
import { fmt } from "../utils/format";

export default function AdSetStats({ adsetNames }) {
  const [expanded, setExpanded] = useState(null);

  if (!adsetNames?.length) return null;

  const sorted = [...adsetNames].sort((a, b) => b.spend - a.spend);

  const total = {
    spend:       adsetNames.reduce((s,r) => s + r.spend, 0),
    impressions: adsetNames.reduce((s,r) => s + r.impressions, 0),
    reach:       adsetNames.reduce((s,r) => s + r.reach, 0),
    clicks:      adsetNames.reduce((s,r) => s + r.clicks, 0),
    messages:    adsetNames.reduce((s,r) => s + r.messages, 0),
  };

  return (
    <>
      <p className="section-label">กลุ่มเป้าหมาย (Ad Sets)</p>
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table className="region-table">
            <thead>
              <tr>
                <th>ชื่อกลุ่มเป้าหมาย</th>
                <th>Spend</th>
                <th>Reach</th>
                <th>แสดงโฆษณา</th>
                <th>คลิก</th>
                <th>CTR</th>
                <th>CPM</th>
                <th>ข้อความ</th>
                <th>ต้นทุน/ข้อความ</th>
                <th>สัดส่วน</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => {
                const pct   = total.spend > 0 ? (r.spend / total.spend * 100).toFixed(1) : 0;
                const isExp = expanded === r.name;
                return (
                  <>
                    <tr key={r.name}
                      className={`region-row ${isExp ? "expanded" : ""}`}
                      onClick={() => setExpanded(isExp ? null : r.name)}
                      style={{ cursor:"pointer" }}>
                      <td style={{ fontWeight:500, maxWidth:"200px", wordBreak:"break-word" }}>
                        {r.name}
                      </td>
                      <td className="mono">{fmt.thb(r.spend)}</td>
                      <td className="mono">{fmt.num(r.reach)}</td>
                      <td className="mono">{fmt.num(r.impressions)}</td>
                      <td className="mono">{fmt.num(r.clicks)}</td>
                      <td className="mono" style={{ color: r.ctr > 3 ? "var(--teal)" : "inherit" }}>
                        {r.ctr.toFixed(2)}%
                      </td>
                      <td className="mono" style={{ color: r.cpm > 200 ? "var(--red)" : r.cpm > 50 ? "var(--amber)" : "var(--teal)" }}>
                        {fmt.thb(r.cpm)}
                      </td>
                      <td className="mono" style={{ color:"var(--green)" }}>
                        {r.messages > 0 ? fmt.num(r.messages) : "—"}
                      </td>
                      <td className="mono" style={{ color:"var(--teal)" }}>
                        {r.messages > 0 ? fmt.thb(r.cpmsg) : "—"}
                      </td>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                          <div style={{ width:"60px", height:"6px", borderRadius:"3px", background:"var(--surface2)" }}>
                            <div style={{ width:`${pct}%`, height:"100%", borderRadius:"3px", background:"var(--blue)" }} />
                          </div>
                          <span style={{ fontSize:"12px", color:"var(--muted)" }}>{pct}%</span>
                        </div>
                      </td>
                      <td className="expand-icon">{isExp ? "▲" : "▼"}</td>
                    </tr>

                    {isExp && (
                      <tr key={r.name + "_detail"} className="detail-row">
                        <td colSpan={11} style={{ padding:0 }}>
                          <div className="detail-wrap">
                            <table className="detail-table">
                              <thead>
                                <tr>
                                  <th>เมตริก</th>
                                  <th>ค่า</th>
                                  <th>เปรียบเทียบกับรวม</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  { label:"Spend",          val: fmt.thb(r.spend),       pct: total.spend > 0 ? (r.spend/total.spend*100).toFixed(1) : 0,             color:"var(--blue)"  },
                                  { label:"Reach",          val: fmt.num(r.reach),        pct: total.reach > 0 ? (r.reach/total.reach*100).toFixed(1) : 0,             color:"var(--teal)"  },
                                  { label:"แสดงโฆษณา",     val: fmt.num(r.impressions),  pct: total.impressions > 0 ? (r.impressions/total.impressions*100).toFixed(1) : 0, color:"var(--amber)" },
                                  { label:"คลิก",          val: fmt.num(r.clicks),       pct: total.clicks > 0 ? (r.clicks/total.clicks*100).toFixed(1) : 0,          color:"var(--blue)"  },
                                  { label:"CTR",           val: r.ctr.toFixed(2) + "%",  pct: null, color: r.ctr > 3 ? "var(--teal)" : "inherit" },
                                  { label:"CPM",           val: fmt.thb(r.cpm),          pct: null, color: r.cpm > 200 ? "var(--red)" : r.cpm > 50 ? "var(--amber)" : "var(--teal)" },
                                  { label:"CPC",           val: fmt.thb(r.cpc),          pct: null, color:"inherit" },
                                  { label:"ข้อความ",       val: r.messages > 0 ? fmt.num(r.messages) : "—", pct: r.messages > 0 && total.messages > 0 ? (r.messages/total.messages*100).toFixed(1) : null, color:"var(--green)" },
                                  { label:"ต้นทุน/ข้อความ", val: r.messages > 0 ? fmt.thb(r.cpmsg) : "—", pct: null, color:"var(--teal)" },
                                ].map(item => (
                                  <tr key={item.label}>
                                    <td style={{ color:"var(--muted)", fontSize:"12px" }}>{item.label}</td>
                                    <td className="mono" style={{ color: item.color, fontWeight:600 }}>{item.val}</td>
                                    <td>
                                      {item.pct !== null ? (
                                        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                                          <div style={{ width:"80px", height:"5px", borderRadius:"3px", background:"var(--surface2)" }}>
                                            <div style={{ width:`${item.pct}%`, height:"100%", borderRadius:"3px", background: item.color }} />
                                          </div>
                                          <span style={{ fontSize:"11px", color:"var(--muted)" }}>{item.pct}% ของรวม</span>
                                        </div>
                                      ) : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop:"2px solid var(--border)", background:"var(--surface2)" }}>
                <td style={{ fontWeight:700 }}>รวม</td>
                <td className="mono" style={{ fontWeight:700 }}>{fmt.thb(total.spend)}</td>
                <td className="mono" style={{ fontWeight:700 }}>{fmt.num(total.reach)}</td>
                <td className="mono" style={{ fontWeight:700 }}>{fmt.num(total.impressions)}</td>
                <td className="mono" style={{ fontWeight:700 }}>{fmt.num(total.clicks)}</td>
                <td className="mono" style={{ fontWeight:700 }}>
                  {total.impressions > 0 ? (total.clicks/total.impressions*100).toFixed(2) : 0}%
                </td>
                <td className="mono" style={{ fontWeight:700 }}>
                  {total.impressions > 0 ? fmt.thb(total.spend/total.impressions*1000) : "—"}
                </td>
                <td className="mono" style={{ fontWeight:700, color:"var(--green)" }}>
                  {total.messages > 0 ? fmt.num(total.messages) : "—"}
                </td>
                <td className="mono" style={{ fontWeight:700, color:"var(--teal)" }}>
                  {total.messages > 0 ? fmt.thb(total.spend/total.messages) : "—"}
                </td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
