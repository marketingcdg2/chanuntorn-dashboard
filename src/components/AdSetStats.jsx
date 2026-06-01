// components/AdSetStats.jsx — Ad Group Statistics แบ่งตามเพศ
// Props: adsets[]
import { fmt } from "../utils/format";

const GENDER_LABEL = { female:"หญิง", male:"ชาย" };
const GENDER_COLOR = { female:"var(--teal)", male:"var(--blue)" };

export default function AdSetStats({ adsets }) {
  if (!adsets?.length) return null;

  const total = {
    spend:       adsets.reduce((s,r) => s + r.spend, 0),
    impressions: adsets.reduce((s,r) => s + r.impressions, 0),
    reach:       adsets.reduce((s,r) => s + r.reach, 0),
    messages:    adsets.reduce((s,r) => s + r.messages, 0),
  };

  const COLS = ["เพศ", "Spend", "Reach", "แสดงโฆษณา", "ข้อความ"];

  return (
    <>
      <p className="section-label">Ad Group Statistics</p>
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <table className="region-table">
          <thead>
            <tr>
              {COLS.map(c => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {adsets
              .filter(r => r.gender !== "unknown")
              .sort((a,b) => b.spend - a.spend)
              .map(r => {
                const pctSpend = total.spend > 0 ? (r.spend/total.spend*100).toFixed(1) : 0;
                return (
                  <tr key={r.gender} className="region-row" style={{ cursor:"default" }}>
                    <td>
                      <span style={{
                        color: GENDER_COLOR[r.gender] ?? "var(--muted)",
                        fontWeight: 700, fontSize:"14px"
                      }}>
                        {GENDER_LABEL[r.gender] ?? r.gender}
                      </span>
                    </td>
                    <td className="mono">
                      {fmt.thb(r.spend)}
                      <span style={{ fontSize:"11px", color:"var(--muted)", marginLeft:"6px" }}>
                        {pctSpend}%
                      </span>
                    </td>
                    <td className="mono">{fmt.num(r.reach)}</td>
                    <td className="mono">{fmt.num(r.impressions)}</td>
                    <td className="mono" style={{ color:"var(--green)" }}>
                      {r.messages > 0 ? fmt.num(r.messages) : "—"}
                    </td>
                  </tr>
                );
              })
            }
            {/* แถวรวม */}
            <tr style={{ borderTop:"2px solid var(--border)", background:"var(--surface2)" }}>
              <td style={{ fontWeight:700, fontSize:"13px" }}>รวม</td>
              <td className="mono" style={{ fontWeight:700 }}>{fmt.thb(total.spend)}</td>
              <td className="mono" style={{ fontWeight:700 }}>{fmt.num(total.reach)}</td>
              <td className="mono" style={{ fontWeight:700 }}>{fmt.num(total.impressions)}</td>
              <td className="mono" style={{ fontWeight:700, color:"var(--green)" }}>
                {total.messages > 0 ? fmt.num(total.messages) : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
