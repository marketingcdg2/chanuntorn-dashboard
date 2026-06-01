// components/ContentGrid.jsx — Cloudinary upload + localStorage cache แยกตามโปรเจค
import { useState, useEffect } from "react";
import { fmt } from "../utils/format";

const BACKEND     = "https://chanuntorn-backend.onrender.com";
const OBJ_COLOR   = { Awareness:"var(--teal)", Engagement:"var(--blue)" };
const OBJ_ICON    = { Awareness:"📢", Engagement:"💬" };
const SORT_OPTIONS = [
  { value:"default",  label:"ค่าเริ่มต้น"   },
  { value:"spend",    label:"ค่าใช้จ่าย ↓" },
  { value:"reach",    label:"ผู้คน ↓"       },
  { value:"messages", label:"ข้อความ ↓"     },
];

function storageKey(projectId) { return `content_images_${projectId}`; }

function loadCachedImages(projectId) {
  try {
    const saved = localStorage.getItem(storageKey(projectId));
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveCachedImages(projectId, images) {
  try { localStorage.setItem(storageKey(projectId), JSON.stringify(images)); }
  catch {}
}

function groupByNameAndObjective(ads) {
  const map = {};
  (ads||[]).filter(a=>a.spend>0).forEach(a=>{
    const key = `${a.name}__${a.objective}`;
    if(!map[key]) map[key]={name:a.name,objective:a.objective,spend:0,reach:0,impressions:0,clicks:0,messages:0};
    map[key].spend+=a.spend??0; map[key].reach+=a.reach??0;
    map[key].impressions+=a.impressions??0; map[key].clicks+=a.clicks??0;
    map[key].messages+=a.messages??0;
  });
  return Object.values(map);
}

function sortItems(items, sortBy) {
  const aware = items.filter(i=>i.objective==="Awareness");
  const engag = items.filter(i=>i.objective==="Engagement");
  const sortFn = (a,b) => {
    if(sortBy!=="default") return b[sortBy]-a[sortBy];
    if(b.messages!==a.messages) return b.messages-a.messages;
    if(b.reach!==a.reach) return b.reach-a.reach;
    return b.spend-a.spend;
  };
  return [...aware.sort(sortFn),...engag.sort(sortFn)];
}

export default function ContentGrid({ ads, projectId }) {
  const [images,    setImages]    = useState(() => loadCachedImages(projectId));
  const [lightbox,  setLightbox]  = useState(null);
  const [sortBy,    setSortBy]    = useState("default");
  const [uploading, setUploading] = useState({});

  // โหลด cache ใหม่ทุกครั้งที่เปลี่ยนโปรเจค
  useEffect(() => {
    setImages(loadCachedImages(projectId));
  }, [projectId]);

  // sync รูปจาก Cloudinary ใน background แยกตามโปรเจค
  useEffect(() => {
    if (!projectId) return;
    fetch(`${BACKEND}/api/images?project=${projectId}`)
      .then(r=>r.json())
      .then(d=>{
        if(d.images) {
          setImages(prev => {
            const merged = { ...prev, ...d.images };
            saveCachedImages(projectId, merged);
            return merged;
          });
        }
      })
      .catch(()=>{});
  }, [projectId]);

  if (!ads?.length) return null;
  const raw   = groupByNameAndObjective(ads);
  const items = sortItems(raw, sortBy);

  async function handleImageUpload(key, e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // แสดง preview ทันที
    const previewUrl = URL.createObjectURL(file);
    setImages(prev => ({ ...prev, [key]: previewUrl }));

    setUploading(prev=>({...prev,[key]:true}));
    const formData = new FormData();
    formData.append("image", file);
    formData.append("key", `${projectId}__${key}`); // เพิ่ม projectId ใน key
    formData.append("project", projectId);

    try {
      const res  = await fetch(`${BACKEND}/api/upload`, { method:"POST", body:formData });
      const data = await res.json();
      if(data.url) {
        setImages(prev => {
          const updated = { ...prev, [key]: data.url };
          saveCachedImages(projectId, updated);
          return updated;
        });
      }
    } catch(err) {
      alert("อัปโหลดไม่สำเร็จ: " + err.message);
    } finally {
      setUploading(prev=>({...prev,[key]:false}));
    }
  }

  async function handleImageDelete(key) {
    if (!confirm("ลบรูปนี้ออก?")) return;
    setImages(prev => {
      const updated = { ...prev };
      delete updated[key];
      saveCachedImages(projectId, updated);
      return updated;
    });
    try {
      await fetch(`${BACKEND}/api/upload`, {
        method:"DELETE",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ key: `${projectId}__${key}` }),
      });
    } catch {}
  }

  return (
    <>
      <div className="content-header">
        <p className="section-label" style={{margin:0}}>คอนเทนต์</p>
        <div className="content-filter">
          <span className="filter-label">เรียงตาม</span>
          {SORT_OPTIONS.map(o=>(
            <button key={o.value}
              className={`filter-btn ${sortBy===o.value?"active":""}`}
              onClick={()=>setSortBy(o.value)}>{o.label}</button>
          ))}
        </div>
      </div>

      <div className="checklist-wrap">
        {items.map(c=>{
          const key     = `${c.name}__${c.objective}`;
          const imgUrl  = images[key];
          const isUploading = uploading[key];

          return (
            <div key={key} className="checklist-item">
              <div className="cl-thumb">
                {imgUrl ? (
                  <div style={{position:"relative"}}>
                    <img src={imgUrl} alt={c.name} className="cl-img"
                      title="คลิกขยายรูป" style={{cursor:"zoom-in"}}
                      onClick={()=>setLightbox(imgUrl)} />
                    <button onClick={()=>handleImageDelete(key)} title="ลบรูป"
                      style={{position:"absolute",top:"4px",right:"4px",
                        background:"rgba(240,62,62,.85)",border:"none",color:"#fff",
                        borderRadius:"50%",width:"20px",height:"20px",fontSize:"11px",
                        cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                    <label title="เปลี่ยนรูป"
                      style={{position:"absolute",bottom:"4px",right:"4px",
                        background:"rgba(59,91,219,.85)",border:"none",color:"#fff",
                        borderRadius:"50%",width:"20px",height:"20px",fontSize:"11px",
                        cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      ✎
                      <input type="file" accept="image/*" style={{display:"none"}}
                        onChange={e=>handleImageUpload(key,e)} />
                    </label>
                  </div>
                ) : (
                  <label className="cl-img-placeholder" title="คลิกเพิ่มรูป">
                    {isUploading
                      ? <span style={{fontSize:"10px",color:"var(--blue)",textAlign:"center",padding:"4px"}}>กำลังอัปโหลด...</span>
                      : <><span className="cl-img-icon">{OBJ_ICON[c.objective]??"🖼"}</span>
                          <span className="cl-img-hint">+ รูป</span></>
                    }
                    <input type="file" accept="image/*" style={{display:"none"}}
                      onChange={e=>handleImageUpload(key,e)} />
                  </label>
                )}
              </div>

              <div className="cl-body">
                <div className="cl-top">
                  <span className="cl-name">{c.name}</span>
                  <span className="cl-obj" style={{color:OBJ_COLOR[c.objective]}}>{c.objective}</span>
                </div>
                <div className="cl-metrics">
                  <div className="cl-metric">
                    <span className="cm-label">ค่าใช้จ่าย</span>
                    <span className="cm-val" style={{color:"var(--blue)"}}>{fmt.thb(c.spend)}</span>
                  </div>
                  <div className="cl-metric">
                    <span className="cm-label">ผู้คน</span>
                    <span className="cm-val" style={{color:"var(--teal)"}}>{fmt.num(c.reach)}</span>
                  </div>
                  <div className="cl-metric">
                    <span className="cm-label">ข้อความ</span>
                    <span className="cm-val" style={{color:"var(--green)"}}>
                      {c.messages>0?fmt.num(c.messages):"—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {lightbox && (
        <div className="lightbox-overlay" onClick={()=>setLightbox(null)}>
          <div className="lightbox-box" onClick={e=>e.stopPropagation()}>
            <button className="lightbox-close" onClick={()=>setLightbox(null)}>✕</button>
            <img src={lightbox} alt="preview" className="lightbox-img" />
          </div>
        </div>
      )}
    </>
  );
}
