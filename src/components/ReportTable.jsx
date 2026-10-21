import { useState } from "react";
import { FIXED, OPTIONAL, METRICS, total, number } from "../utils/report";

export default function ReportTable({
  title,
  scope,
  rows,
  onEdit,
  onImage,
  disabled,
}) {
  const [search, setSearch] = useState("");
  const [columns, setColumns] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`report-columns-${scope}`));
      return Array.isArray(saved)
        ? OPTIONAL.filter((k) => saved.includes(k))
        : OPTIONAL.slice(0, 4);
    } catch {
      return OPTIONAL.slice(0, 4);
    }
  });
  const [sort, setSort] = useState({ key: "spend", direction: -1 });
  const [settings, setSettings] = useState(false);
  const keys = [...columns, ...FIXED];
  const filtered = rows
    .filter((r) =>
      r.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    )
    .sort(
      (a, b) =>
        sort.direction *
        (sort.key === "name"
          ? a.name.localeCompare(b.name, "th")
          : a[sort.key] - b[sort.key]),
    );
  function toggle(k) {
    const next = OPTIONAL.filter((key) =>
      key === k ? !columns.includes(key) : columns.includes(key),
    );
    setColumns(next);
    try {
      localStorage.setItem(`report-columns-${scope}`, JSON.stringify(next));
    } catch {
      /* Preferences remain available for this session. */
    }
  }
  function sortBy(key) {
    setSort((s) => ({ key, direction: s.key === key ? -s.direction : -1 }));
  }
  return (
    <section className="panel table-panel">
      <header className="section-header">
        <h2>{title}</h2>
        <div className="table-tools">
          <input
            aria-label={`ค้นหา ${title}`}
            className="search"
            placeholder="⌕  ค้นหาชื่อ…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="badge">รวมชื่อที่เหมือนกัน ✓</span>
          <div className="popover-wrap">
            <button
              onClick={() => setSettings(!settings)}
              aria-expanded={settings}
            >
              ☷ ตั้งค่าคอลัมน์
            </button>
            {settings && (
              <div className="popover columns">
                <strong>คอลัมน์ที่แสดง</strong>
                {OPTIONAL.map((k) => (
                  <label key={k}>
                    <input
                      type="checkbox"
                      checked={columns.includes(k)}
                      onChange={() => toggle(k)}
                    />
                    {METRICS[k]}
                  </label>
                ))}
                <hr />
                {FIXED.map((k) => (
                  <label key={k}>
                    <input type="checkbox" checked disabled />
                    {METRICS[k]} <span className="muted">ล็อก</span>
                  </label>
                ))}
                <button onClick={() => setSettings(false)}>เสร็จสิ้น</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th className="name-cell">
                <button
                  className="heading-button"
                  onClick={() => sortBy("name")}
                >
                  {scope === "group" ? "ชื่อกลุ่มโฆษณา" : "ชื่อ Creative"} ↕
                </button>
              </th>
              {keys.map((k) => (
                <th
                  key={k}
                  aria-sort={
                    sort.key === k
                      ? sort.direction === 1
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button className="heading-button" onClick={() => sortBy(k)}>
                    {FIXED.includes(k) && (
                      <span className="lock" title="คอลัมน์ถาวร">
                        ▣{" "}
                      </span>
                    )}
                    {METRICS[k]} <span className="muted">↕</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.name}>
                <td className="name-cell">
                  <div className="row-name">
                    {scope === "creative" &&
                      (row.images.length ? (
                        <button
                          className="thumbnail"
                          title="ขยายรูป Creative"
                          onClick={() => onImage(row)}
                        >
                          <img
                            src={row.images[0]}
                            alt={row.name}
                            loading="lazy"
                          />
                          <span>⌕</span>
                        </button>
                      ) : (
                        <span className="no-image" title="ยังไม่มีรูป Creative">
                          ▧
                        </span>
                      ))}
                    <span>
                      {row.name}
                      {row.count > 1 && (
                        <small className="count">รวม {row.count} รายการ</small>
                      )}
                    </span>
                  </div>
                </td>
                {keys.map((k) => (
                  <td key={k}>
                    {FIXED.includes(k) ? (
                      <button
                        disabled={disabled}
                        className="metric-edit"
                        aria-label={`แก้ไข ${METRICS[k]} ${row.name}`}
                        onClick={() =>
                          onEdit({ scope, name: row.name, metric: k })
                        }
                      >
                        {number(row[k], k)}
                        <span className="edit-pencil">✎</span>
                      </button>
                    ) : (
                      number(row[k], k)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr>
                <td>{search ? "รวมผลการค้นหา" : "รวมทั้งหมด"}</td>
                {keys.map((k) => (
                  <td key={k}>{number(total(filtered)[k], k)}</td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
        {!filtered.length && (
          <div className="empty">ไม่พบข้อมูลในช่วงวันที่นี้</div>
        )}
      </div>
    </section>
  );
}
