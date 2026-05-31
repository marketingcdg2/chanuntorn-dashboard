// components/AlertBanner.jsx
// Props: alerts[]  — alert shape: { type, title, body }
const COLOR = { warning: "var(--amber)", danger: "var(--red)", info: "var(--blue)" };

export default function AlertBanner({ alerts }) {
  if (!alerts?.length) return null;
  return (
    <div className="alerts-wrap">
      {alerts.map((a, i) => (
        <div key={i} className="alert-box" style={{
          borderColor: COLOR[a.type] + "33",
          background:  COLOR[a.type] + "12",
        }}>
          <span className="alert-icon" style={{ color: COLOR[a.type] }}>⚠</span>
          <div>
            <div className="alert-title" style={{ color: COLOR[a.type] }}>{a.title}</div>
            <div className="alert-body">{a.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
