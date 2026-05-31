// components/Toolbar.jsx
// Renders: project dropdown + date range filter + compare toggle
// Props: projects, activeProject, onProjectChange,
//        dateRange, onDateRangeChange,
//        compareRange, onCompareRangeChange, compareMode, onCompareModeChange

export default function Toolbar({
  projects, activeProject, onProjectChange,
  dateRange, onDateRangeChange,
  compareRange, onCompareRangeChange,
  compareMode, onCompareModeChange,
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <select
          className="toolbar-select"
          value={activeProject}
          onChange={(e) => onProjectChange(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="toolbar-right">
        <div className="date-group">
          <label className="date-label">ช่วงหลัก</label>
          <input
            type="date" className="toolbar-date"
            value={dateRange.from}
            onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
          />
          <span className="date-sep">—</span>
          <input
            type="date" className="toolbar-date"
            value={dateRange.to}
            onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
          />
        </div>

        <button
          className={`compare-btn ${compareMode ? "active" : ""}`}
          onClick={() => onCompareModeChange(!compareMode)}
        >
          เปรียบเทียบ
        </button>

        {compareMode && (
          <div className="date-group">
            <label className="date-label">เทียบกับ</label>
            <input
              type="date" className="toolbar-date compare"
              value={compareRange.from}
              onChange={(e) => onCompareRangeChange({ ...compareRange, from: e.target.value })}
            />
            <span className="date-sep">—</span>
            <input
              type="date" className="toolbar-date compare"
              value={compareRange.to}
              onChange={(e) => onCompareRangeChange({ ...compareRange, to: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
