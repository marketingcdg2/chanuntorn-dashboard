import { fmt } from "../utils/format";

export default function SpendChart({ campaigns, budget }) {
  const awareness  = campaigns.filter(c => c.objective === "Awareness");
  const engagement = campaigns.filter(c => c.objective === "Engagement");
  const sum = arr => arr.reduce((s,c) => s + c.spend, 0);
  const total = sum(campaigns);

  const aPct = budget > 0 ? ` — ${((sum(awareness)/budget)*100).toFixed(1)}%` : "";
  const ePct = budget > 0 ? ` — ${((sum(engagement)/budget)*100).toFixed(1)}%` : "";
  const spendPct = budget > 0 ? ` (${((total/budget)*100).toFixed(1)}% ของงบ)` : "";

  const items = [
    { label:`Awareness${aPct}`,          value:sum(awareness),  max:total||1, color:"var(--teal)", displayVal:fmt.thb(sum(awareness))  },
    { label:`Message/Engagement${ePct}`, value:sum(engagement), max:total||1, color:"var(--blue)", displayVal:fmt.thb(sum(engagement)) },
  ];

  return (
    <>
      <p className="section-label">Spend & Performance{spendPct}</p>
      <div className="card">
        <div className="card-title">Spend ตาม Objective</div>
        {items.map(r => (
          <div key={r.label} className="bar-row">
            <span className="bar-label" style={{ width:"220px", fontSize:"13px" }}>{r.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width:`${(r.value/r.max*100).toFixed(1)}%`, background:r.color }} />
            </div>
            <span className="bar-val" style={{ color:r.color }}>{r.displayVal}</span>
          </div>
        ))}
      </div>
    </>
  );
}
