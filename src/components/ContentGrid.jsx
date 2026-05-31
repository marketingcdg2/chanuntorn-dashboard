// components/ContentGrid.jsx
import { useState } from "react";
import { fmt } from "../utils/format";

const OBJ_COLOR = { Awareness:"var(--teal)", Engagement:"var(--blue)" };
const OBJ_ICON  = { Awareness:"📢", Engagement:"💬" };

const SORT_OPTIONS = [
  { value:"default",  label:"ค่าเริ่มต้น"   },
  { value:"spend",    label:"ค่าใช้จ่าย ↓" },
  { value:"reach",    label:"ผู้คน ↓"       },
  { value:"messages", label:"ข้อความ ↓"     },
];

function groupByNameAndObjective(ads) {
  const map = {};
  (ads || []).filter(a => a.spend > 0).forEach(a => {
    const key = `${a.name}__${a.objective}`;
    if (!map[key]) {
      map[key] = { name:a.name, objective:a.objective,
        spend:0, reach:0, impressions:0, clicks:0, messages:0 };
    }
    map[key].spend       += a.spend       ?? 0;
    map[key].reach       += a.reach       ?? 0;
    map[key].impressions += a.impressions ?? 0;
    map[key].clicks      += a.clicks      ?? 0;
    map[key].messages    += a.messages    ?? 0;
  });
  return Object.values(map);
}

function sortItems(items, sortBy) {
  const aware = items.filter(i => i.objective === "Awareness");
  const engag = items.filter(i => i.objective === "Engagement");

  // เรียงใน Awareness และ Engagement แยกกัน ตามกฎ
  const sortFn = (a, b) => {
    if (sortBy !== "default") return b[sortBy] - a[sortBy];
    // default — ข้อความมากสุดก่อน, ถ้าเท่ากัน → ผู้คน, ถ้าเท่ากัน → ค่าใช้จ่าย
    if (b.messages !== a.messages) return b.messages - a.messages;
    if (b.reach    !== a.reach)    return b.reach    - a.reach;
    return b.spend - a.spend;
  };

  return [...aware.sort(sortFn), ...engag.sort(sortFn)];
}

export default function ContentGrid({ ads }) {
  const [images,   setImages]   = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [sortBy,   setSortBy]   = useState("default");

  if (!ads?.length) return null;

  const raw   = groupByNameAndObjective(ads);
  const items = sortItems(raw, sortBy);

  function handleImageUpload(key, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImages(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
  }

  return (
    <>
      <div className="content-header">
        <p className="section-label" style={{ margin:0 }}>คอนเทนต์</p>
        <div className="content-filter">
          <span className="filter-label">เรียงตาม</span>
          {SORT_OPTIONS.map(o => (
            <button key={o.value}
              className={`filter-btn ${sortBy===o.value?"active":""}`}
              onClick={() => setSortBy(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="checklist-wrap">
        {items.map(c => {
          const key    = `${c.name}__${c.objective}`;
          const imgUrl = images[key];
          return (
            <div key={key} className="checklist-item">
              <div className="cl-thumb">
                {imgUrl
                  ? <img src={imgUrl} alt={c.name} className="cl-img"
                      title="คลิกขยายรูป" style={{ cursor:"zoom-in" }}
                      onClick={() => setLightbox(imgUrl)} />
                  : <label className="cl-img-placeholder" title="คลิกเพิ่มรูป">
                      <span className="cl-img-icon">{OBJ_ICON[c.objective] ?? "🖼"}</span>
                      <span className="cl-img-hint">+ รูป</span>
                      <input type="file" accept="image/*" style={{ display:"none" }}
                        onChange={e => handleImageUpload(key, e)} />
                    </label>
                }
              </div>
              <div className="cl-body">
                <div className="cl-top">
                  <span className="cl-name">{c.name}</span>
                  <span className="cl-obj" style={{ color:OBJ_COLOR[c.objective] }}>
                    {c.objective}
                  </span>
                </div>
                <div className="cl-metrics">
                  <div className="cl-metric">
                    <span className="cm-label">ค่าใช้จ่าย</span>
                    <span className="cm-val" style={{ color:"var(--blue)" }}>{fmt.thb(c.spend)}</span>
                  </div>
                  <div className="cl-metric">
                    <span className="cm-label">ผู้คน</span>
                    <span className="cm-val" style={{ color:"var(--teal)" }}>{fmt.num(c.reach)}</span>
                  </div>
                  <div className="cl-metric">
                    <span className="cm-label">ข้อความ</span>
                    <span className="cm-val" style={{ color:"var(--green)" }}>
                      {c.messages > 0 ? fmt.num(c.messages) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <div className="lightbox-box" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            <img src={lightbox} alt="preview" className="lightbox-img" />
          </div>
        </div>
      )}
    </>
  );
}
