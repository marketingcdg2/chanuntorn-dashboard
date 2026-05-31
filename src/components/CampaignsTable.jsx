// components/CampaignsTable.jsx
// Props: campaigns[]
import { fmt } from "../utils/format";

const CPM_COLOR = (v) => v > 200 ? "var(--red)" : v > 50 ? "var(--amber)" : "var(--teal)";
const CTR_COLOR = (v) => v > 3   ? "var(--teal)" : "inherit";

const COLS = [
  { label: "Campaign",    render: (r) => r.name },
  { label: "Objective",  render: (r) => r.objective },
  { label: "Status",     render: (r) => <StatusBadge status={r.status} /> },
  { label: "Spend",      render: (r) => fmt.thb(r.spend) },
  { label: "Impressions",render: (r) => fmt.num(r.impressions) },
  { label: "Reach",      render: (r) => fmt.num(r.reach) },
  { label: "CTR",        render: (r) => <span style={{ color: CTR_COLOR(r.ctr) }}>{fmt.pct(r.ctr)}</span> },
  { label: "CPC",        render: (r) => fmt.thb(r.cpc) },
  { label: "CPM",        render: (r) => <span style={{ color: CPM_COLOR(r.cpm) }}>{fmt.thb(r.cpm)}</span> },
];

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status === "active" ? "Active" : "Paused"}</span>;
}

export default function CampaignsTable({ campaigns }) {
  return (
    <>
      <p className="section-label">Campaigns เดือนนี้</p>
      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table className="camp-table">
            <thead>
              <tr>{COLS.map((c) => <th key={c.label}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {campaigns.map((row) => (
                <tr key={row.id}>
                  {COLS.map((c) => <td key={c.label}>{c.render(row)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
