import { useState } from "react";
import { METRICS, OPTIONAL, number } from "../utils/report";
export default function TrendChart({ rows }) {
  const [metrics, setMetrics] = useState(["impressions", "clicks"]);
  const [hover, setHover] = useState(null);
  const colors = ["#1670f8", "#00a6a0"];
  const maxima = metrics.map(
    (k) => Math.max(1, ...rows.map((r) => r[k])) * 1.15,
  );
  const x = (i) => 65 + (i / Math.max(1, rows.length - 1)) * 1070;
  const y = (value, axis) => 200 - (value / maxima[axis]) * 165;
  return (
    <section className="panel chart">
      <header className="section-header">
        <h2>แนวโน้มผลลัพธ์</h2>
        <div className="chart-selects">
          {metrics.map((metric, i) => (
            <label key={i} style={{ color: colors[i] }}>
              ●{" "}
              <select
                aria-label={`เมตริกกราฟ ${i + 1}`}
                value={metric}
                onChange={(e) =>
                  setMetrics(
                    metrics.map((m, j) => (j === i ? e.target.value : m)),
                  )
                }
              >
                {OPTIONAL.map((k) => (
                  <option key={k} value={k}>
                    {METRICS[k]}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <span className="muted daily-label">รายวัน</span>
      </header>
      {rows.length ? (
        <>
          <div className="chart-canvas">
            <svg
              viewBox="0 0 1200 240"
              role="img"
              aria-label={`กราฟรายวัน ${metrics.map((k) => METRICS[k]).join(" และ ")}`}
            >
              {[0, 1, 2, 3, 4].map((t) => (
                <g key={t}>
                  <line
                    x1="65"
                    x2="1135"
                    y1={200 - t * 41.25}
                    y2={200 - t * 41.25}
                    stroke="#e6edf4"
                  />
                  {metrics.map((k, i) => (
                    <text
                      key={i}
                      x={i ? 1145 : 55}
                      y={204 - t * 41.25}
                      textAnchor={i ? "start" : "end"}
                      fill={colors[i]}
                      fontSize="10"
                    >
                      {number((maxima[i] * t) / 4, k)}
                    </text>
                  ))}
                </g>
              ))}
              {metrics.map((k, axis) => (
                <g key={axis}>
                  <polyline
                    points={rows
                      .map((r, i) => `${x(i)},${y(r[k], axis)}`)
                      .join(" ")}
                    fill="none"
                    stroke={colors[axis]}
                    strokeWidth="2.5"
                  />
                  {rows.length < 65 &&
                    rows.map((r, i) => (
                      <circle
                        key={r.date}
                        cx={x(i)}
                        cy={y(r[k], axis)}
                        r="3"
                        fill={colors[axis]}
                      />
                    ))}
                </g>
              ))}
              {rows.map((r, i) => (
                <g key={r.date}>
                  {(i % Math.max(1, Math.ceil(rows.length / 12)) === 0 ||
                    i === rows.length - 1) && (
                    <text
                      x={x(i)}
                      y="225"
                      textAnchor="middle"
                      fontSize="10"
                      fill="#7d8ca4"
                    >
                      {r.date.slice(5)}
                    </text>
                  )}
                  <rect
                    x={x(i) - Math.max(4, 1070 / rows.length / 2)}
                    y="20"
                    width={Math.max(8, 1070 / rows.length)}
                    height="185"
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <title>
                      {r.date}:{" "}
                      {metrics
                        .map((k) => `${METRICS[k]} ${number(r[k], k)}`)
                        .join(", ")}
                    </title>
                  </rect>
                </g>
              ))}
            </svg>
          </div>
          <div className="chart-legend">
            {hover !== null && <span>{rows[hover]?.date}</span>}
            {metrics.map((k, i) => (
              <span key={i} style={{ color: colors[i] }}>
                ● {METRICS[k]} {hover !== null && number(rows[hover]?.[k], k)}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="empty">ไม่มีข้อมูลกราฟในช่วงวันที่นี้</div>
      )}
    </section>
  );
}
