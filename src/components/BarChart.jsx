// BarChart — reusable horizontal bar component
export default function BarChart({ title, items }) {
  return (
    <div className="card">
      {title && <div className="card-title">{title}</div>}
      {items.map(r => (
        <div key={r.label} className="bar-row">
          <span className="bar-label">{r.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width:`${r.max > 0 ? (r.value/r.max*100).toFixed(1) : 0}%`, background:r.color }} />
          </div>
          <span className="bar-val" style={{ color:r.color }}>{r.displayVal}</span>
        </div>
      ))}
    </div>
  );
}
