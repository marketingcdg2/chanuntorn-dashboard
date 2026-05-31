export default function Header({ projectLabel, monthLabel }) {
  return (
    <div className="header-wrap">
      <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
        <div style={{
          width:"36px", height:"36px", borderRadius:"10px",
          background:"var(--blue)", display:"flex", alignItems:"center",
          justifyContent:"center", color:"#fff", fontSize:"16px", fontWeight:"800"
        }}>C</div>
        <div>
          <h1 className="header-title">{projectLabel} — Ad Report</h1>
          <p className="header-sub">Chanuntorn Dashboard · {monthLabel}</p>
        </div>
      </div>
    </div>
  );
}
