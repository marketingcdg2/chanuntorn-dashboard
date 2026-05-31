// components/BarChart.jsx  — reusable horizontal bar chart
// Props: title, items[]
// item shape: { label, value, max, color, displayVal }

export default function BarChart({ title, items }) {
  return (
    <div className="card">
      {title && <div className="card-title">{title}</div>}
      {items.map((item) => {
        const pct = Math.min((item.value / item.max) * 100, 100).toFixed(1);
        return (
          <div key={item.label} className="bar-row">
            <span className="bar-label" title={item.label}>{item.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%`, background: item.color }} />
            </div>
            <span className="bar-val" style={{ color: item.color }}>{item.displayVal}</span>
          </div>
        );
      })}
    </div>
  );
}
