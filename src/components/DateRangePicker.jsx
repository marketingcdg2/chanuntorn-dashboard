// components/DateRangePicker.jsx — date picker แบบ Meta
import { useState } from "react";

const PRESETS = [
  { label:"เดือนนี้",     since: () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; }, until: () => today() },
  { label:"7 วันล่าสุด", since: () => daysAgo(7),  until: () => today() },
  { label:"14 วันล่าสุด",since: () => daysAgo(14), until: () => today() },
  { label:"30 วันล่าสุด",since: () => daysAgo(30), until: () => today() },
];

function today() {
  return new Date().toISOString().slice(0,10);
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0,10);
}

export default function DateRangePicker({ since, until, onChange }) {
  const [open, setOpen] = useState(false);
  const [tmpSince, setTmpSince] = useState(since);
  const [tmpUntil, setTmpUntil] = useState(until);

  function applyPreset(p) {
    const s = p.since();
    const u = p.until();
    onChange(s, u);
    setTmpSince(s);
    setTmpUntil(u);
    setOpen(false);
  }

  function applyCustom() {
    if (tmpSince && tmpUntil && tmpSince <= tmpUntil) {
      onChange(tmpSince, tmpUntil);
      setOpen(false);
    }
  }

  return (
    <div className="date-picker-wrap">
      <button className="date-picker-btn" onClick={() => setOpen(v => !v)}>
        📅 {since} → {until}
      </button>

      {open && (
        <div className="date-picker-dropdown">
          {/* Presets */}
          <div className="date-presets">
            {PRESETS.map(p => (
              <button key={p.label} className="preset-btn" onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="date-divider" />

          {/* Custom range */}
          <div className="date-custom">
            <div className="date-field">
              <label>จากวันที่</label>
              <input type="date" value={tmpSince}
                onChange={e => setTmpSince(e.target.value)} />
            </div>
            <div className="date-field">
              <label>ถึงวันที่</label>
              <input type="date" value={tmpUntil}
                onChange={e => setTmpUntil(e.target.value)} />
            </div>
          </div>

          <button className="date-apply-btn" onClick={applyCustom}>
            ดูข้อมูล
          </button>
        </div>
      )}
    </div>
  );
}
