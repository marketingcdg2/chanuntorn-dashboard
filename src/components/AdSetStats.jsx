// components/AdSetStats.jsx — ตาราง Ad Sets แสดงชื่อกลุ่มเป้าหมายพร้อมสถิติ
import { fmt } from "../utils/format";

export default function AdSetStats({ adsetNames }) {
  if (!adsetNames?.length) return null;

  const total = {
    spend:       adsetNames.reduce((s,r) => s + r.spend, 0),
    impressions: adsetNames.reduce((s,r) => s + r.impressions, 0),
    reach:       adsetNames.reduce((s,r) => s + r.reach, 0),
    clicks:      adsetNames.reduce((s,r) => s + r.clicks, 0),
    messages:    adsetNames.reduce((s,r) => s + r.messages, 0),
  };

  const sorted = [...adsetNames].sort((a,b) => b.spend - a.spend);

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
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => {
                const pct = total.spend > 0 ? (r.spend / total.spend * 100).toFixed(1) : 0;
                return (
                  <tr key={r.name} className="region-row" style={{ cursor:"default" }}>
                    <td style={{ fontWeight:500, maxWidth:"220px", wordBreak:"break-word" }}>
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
                        <div style={{ width:"70px", height:"6px", borderRadius:"3px", background:"var(--surface2)" }}>
                          <div style={{ width:`${pct}%`, height:"100%", borderRadius:"3px", background:"var(--blue)" }} />
                        </div>
                        <span style={{ fontSize:"12px", color:"var(--muted)" }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
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
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
