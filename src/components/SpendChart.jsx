// components/SpendChart.jsx
// Props: campaigns[], budget
import { fmt } from "../utils/format";
import BarChart from "./BarChart";

export default function SpendChart({ campaigns, budget }) {
  const awareness  = campaigns.filter(c => c.objective === "Awareness");
  const engagement = campaigns.filter(c => c.objective === "Engagement");
  const sum        = arr => arr.reduce((s,c) => s + c.spend, 0);
  const total      = sum(campaigns);

  const spendPct  = budget > 0 ? ` (${((total/budget)*100).toFixed(1)}% ของงบ)` : "";
  const aPct      = budget > 0 ? ` — ${((sum(awareness)/budget)*100).toFixed(1)}%` : "";
  const ePct      = budget > 0 ? ` — ${((sum(engagement)/budget)*100).toFixed(1)}%` : "";

  const objItems = [
    { label:`Awareness${aPct}`,          value:sum(awareness),  max:total||1, color:"var(--teal)", displayVal:fmt.thb(sum(awareness))  },
    { label:`Message/Engagement${ePct}`, value:sum(engagement), max:total||1, color:"var(--blue)", displayVal:fmt.thb(sum(engagement)) },
  ];

  return (
    <>
      <p className="section-label">Spend & Performance{spendPct}</p>
      <div className="grid-1">
        <BarChart title="Spend ตาม Objective" items={objItems} />
      </div>
    </>
  );
}
