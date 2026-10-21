import { useEffect, useRef, useState } from "react";
import { useReport } from "./hooks/useReport";
import {
  PROJECTS,
  METRICS,
  OPTIONAL,
  today,
  shiftDate,
  total,
  groupRows,
  dailySeries,
  number,
} from "./utils/report";
import ReportTable from "./components/ReportTable";
import ResultDrawer from "./components/ResultDrawer";
import TrendChart from "./components/TrendChart";

function DateFilter({ since, until, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState([since, until]);
  const [error, setError] = useState("");
  function apply(s, u) {
    if (
      !s ||
      !u ||
      s > u ||
      u > today() ||
      (Date.parse(u) - Date.parse(s)) / 86400000 > 366
    ) {
      setError("เลือกวันที่เริ่มต้นก่อนวันสิ้นสุด และไม่เกิน 367 วัน");
      return;
    }
    onChange(s, u);
    setOpen(false);
    setError("");
  }
  function move(direction) {
    const days = (Date.parse(until) - Date.parse(since)) / 86400000 + 1;
    apply(
      shiftDate(since, days * direction),
      shiftDate(until, days * direction),
    );
  }
  return (
    <div className="date-filter popover-wrap">
      <button aria-label="ช่วงก่อนหน้า" onClick={() => move(-1)}>
        ‹
      </button>
      <button
        className="date-display"
        aria-expanded={open}
        onClick={() => {
          setDraft([since, until]);
          setOpen(!open);
        }}
      >
        ▦ {since} — {until}⌄
      </button>
      <button
        aria-label="ช่วงถัดไป"
        disabled={
          shiftDate(
            until,
            (Date.parse(until) - Date.parse(since)) / 86400000 + 1,
          ) > today()
        }
        onClick={() => move(1)}
      >
        ›
      </button>
      {open && (
        <div className="popover date-popover">
          <div className="presets">
            {[
              ["วันนี้", 1],
              ["7 วันล่าสุด", 7],
              ["14 วันล่าสุด", 14],
              ["30 วันล่าสุด", 30],
            ].map(([label, n]) => (
              <button
                key={n}
                onClick={() => apply(shiftDate(today(), 1 - n), today())}
              >
                {label}
              </button>
            ))}
            <button onClick={() => apply(today().slice(0, 7) + "-01", today())}>
              เดือนนี้
            </button>
          </div>
          <div className="date-inputs">
            <label className="field">
              จากวันที่
              <input
                type="date"
                value={draft[0]}
                max={draft[1] || today()}
                onChange={(e) => setDraft([e.target.value, draft[1]])}
              />
            </label>
            <label className="field">
              ถึงวันที่
              <input
                type="date"
                value={draft[1]}
                min={draft[0]}
                max={today()}
                onChange={(e) => setDraft([draft[0], e.target.value])}
              />
            </label>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="primary full" onClick={() => apply(...draft)}>
            ใช้ช่วงวันที่นี้
          </button>
        </div>
      )}
    </div>
  );
}
function ImageViewer({ row, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  return (
    <dialog ref={dialog} className="image-viewer" onCancel={onClose}>
      <header className="section-header">
        <h2>{row.name}</h2>
        <button onClick={onClose} aria-label="ปิดรูป">
          ✕
        </button>
      </header>
      <div className="image-gallery">
        {row.images.map((url) => (
          <img key={url} src={url} alt={row.name} />
        ))}
      </div>
    </dialog>
  );
}
export default function App() {
  const [project, setProject] = useState("motto");
  const [range, setRange] = useState([today().slice(0, 7) + "-01", today()]);
  const [platform, setPlatform] = useState("all");
  const [revision, setRevision] = useState(0);
  const [target, setTarget] = useState(null);
  const [image, setImage] = useState(null);
  const [saved, setSaved] = useState("");
  const [cards, setCards] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem("report-cards"));
      return Array.isArray(v) &&
        v.length === 4 &&
        v.every((k) => OPTIONAL.includes(k))
        ? v
        : ["impressions", "clicks", "messages", "spend"];
    } catch {
      return ["impressions", "clicks", "messages", "spend"];
    }
  });
  const data = useReport(project, ...range, revision);
  const report = data.report;
  const totals = total(report?.campaigns || []);
  const groups = groupRows(
    report?.groups || [],
    data.entries || [],
    "group",
    ...range,
  );
  const creatives = groupRows(
    (report?.creatives || []).map((row) => ({
      ...row,
      image:
        data.images?.[
          `${row.name}__${row.objective?.includes("AWARENESS") ? "Awareness" : "Engagement"}`
        ] ||
        data.images?.[row.name] ||
        data.images?.[`${row.name}__${row.objective}`] ||
        data.images?.[
          `${row.name}__${row.objective?.includes("AWARENESS") ? "Awareness" : "Engagement"}`.replace(
            /[^a-zA-Z0-9_-]/g,
            "_",
          )
        ],
    })),
    data.entries || [],
    "creative",
    ...range,
  );
  const awareness = total(
    report?.campaigns.filter((r) => r.objective?.includes("AWARENESS")) || [],
  );
  const inbox = total(
    report?.campaigns.filter(
      (r) => r.objective?.includes("ENGAGEMENT") || r.objective === "MESSAGES",
    ) || [],
  );
  const other =
    report?.campaigns.filter(
      (r) =>
        !r.objective?.includes("AWARENESS") &&
        !r.objective?.includes("ENGAGEMENT") &&
        r.objective !== "MESSAGES",
    ) || [];
  const series = report ? dailySeries(report.daily, ...range) : [];
  function selectCard(index, key) {
    const next = cards.map((k, i) => (i === index ? key : k));
    setCards(next);
    try {
      localStorage.setItem("report-cards", JSON.stringify(next));
    } catch {
      /* Session preferences still work. */
    }
  }
  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">▥</span> รายงานผลโฆษณา{" "}
          <span className="brand-sub">CHANUNTORN</span>
        </div>
        <button
          onClick={() => {
            setRevision((v) => v + 1);
            setSaved("");
          }}
          disabled={data.loading}
        >
          ↻ รีเฟรชข้อมูล
        </button>
      </header>
      <div className="filterbar">
        <label className="project-label">
          โครงการ
          <select
            aria-label="โครงการ"
            value={project}
            onChange={(e) => {
              setProject(e.target.value);
              setTarget(null);
              setSaved("");
            }}
          >
            {PROJECTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <div className="filters">
          <label className="platform">
            <span className="meta-icon">∞</span>
            <select
              aria-label="แพลตฟอร์ม"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="all">ทุกแพลตฟอร์มที่เชื่อมต่อ</option>
              <option value="meta">Meta Ads</option>
              <option value="google" disabled>
                Google Ads · ยังไม่เชื่อมต่อ
              </option>
            </select>
          </label>
          <DateFilter
            since={range[0]}
            until={range[1]}
            onChange={(s, u) => {
              setRange([s, u]);
              setSaved("");
            }}
          />
        </div>
      </div>
      {saved && (
        <div role="status" className="success">
          ✓ {saved}
        </div>
      )}
      {data.loading && (
        <div className="loading" role="status">
          <span className="spinner" /> กำลังโหลดรายงานโฆษณา…
        </div>
      )}
      {data.error && (
        <div className="error banner" role="alert">
          โหลดข้อมูลโฆษณาไม่สำเร็จ: {data.error}{" "}
          <button onClick={() => setRevision((v) => v + 1)}>ลองอีกครั้ง</button>
        </div>
      )}
      {data.manualError && (
        <div className="error banner" role="alert">
          โหลดผลลัพธ์ที่บันทึกไม่สำเร็จ: {data.manualError} —
          ปิดการแก้ไขชั่วคราว
        </div>
      )}
      {data.imageError && <div className="notice">{data.imageError}</div>}
      {!data.loading && report && (
        <main>
          <div className="kpi-grid">
            {cards.map((key, i) => (
              <section key={i} className="panel kpi">
                <select
                  aria-label={`เมตริกการ์ด ${i + 1}`}
                  value={key}
                  onChange={(e) => selectCard(i, e.target.value)}
                >
                  {OPTIONAL.map((k) => (
                    <option key={k} value={k}>
                      {METRICS[k]}
                    </option>
                  ))}
                </select>
                <strong>{number(totals[key], key)}</strong>
                <span className="muted">Meta Ads · ตามช่วงวันที่เลือก</span>
              </section>
            ))}
          </div>
          <TrendChart rows={series} />
          <section className="panel objectives">
            <header className="section-header">
              <h2>สรุป Objective</h2>
            </header>
            <div className="objective-grid">
              <article className="objective awareness">
                <span className="objective-icon">◉</span>
                <div>
                  <h3>Awareness</h3>
                  <small>ผลลัพธ์</small>
                  <p>
                    <strong>{number(awareness.impressions)}</strong> Impressions
                  </p>
                </div>
                <div className="objective-spend">
                  <small>ค่าใช้จ่าย</small>
                  <strong>{number(awareness.spend, "spend")}</strong>
                </div>
              </article>
              <article className="objective inbox">
                <span className="objective-icon">☏</span>
                <div>
                  <h3>Inbox</h3>
                  <small>ผลลัพธ์</small>
                  <p>
                    <strong>{number(inbox.messages)}</strong> ข้อความ
                  </p>
                </div>
                <div className="objective-spend">
                  <small>ค่าใช้จ่าย</small>
                  <strong>{number(inbox.spend, "spend")}</strong>
                </div>
              </article>
            </div>
            {other.length > 0 && (
              <p className="muted helper">
                Objective อื่น ๆ: ค่าใช้จ่าย{" "}
                {number(total(other).spend, "spend")} (รวมในยอดการ์ดด้านบน)
              </p>
            )}
          </section>
          <ReportTable
            title="สรุป Ad Group"
            scope="group"
            rows={groups}
            onEdit={setTarget}
            disabled={!!data.manualError}
          />
          <ReportTable
            title="สรุป Ad Creative"
            scope="creative"
            rows={creatives}
            onEdit={setTarget}
            onImage={setImage}
            disabled={!!data.manualError}
          />
        </main>
      )}
      <footer>
        <span>
          {PROJECTS.find((p) => p.id === project).label} · {range.join(" — ")}
        </span>
        <span>เชื่อมต่อ Meta Ads · เวลา Asia/Bangkok</span>
      </footer>
      {target && (
        <ResultDrawer
          key={`${project}-${target.scope}-${target.name}`}
          project={project}
          target={target}
          entries={data.entries || []}
          writable={data.writable}
          endDate={range[1]}
          onClose={() => setTarget(null)}
          onSaved={() => {
            setSaved("บันทึกผลลัพธ์เรียบร้อยแล้ว");
            setRevision((v) => v + 1);
          }}
        />
      )}
      {image && <ImageViewer row={image} onClose={() => setImage(null)} />}
    </div>
  );
}
