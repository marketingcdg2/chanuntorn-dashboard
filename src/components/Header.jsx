// components/Header.jsx — ไม่มี badge
export default function Header({ projectLabel, monthLabel }) {
  return (
    <div className="header-wrap">
      <div>
        <h1 className="header-title">{projectLabel} — Ad Report</h1>
        <p className="header-sub">Chanuntorn_MottoScape · {monthLabel}</p>
      </div>
    </div>
  );
}
