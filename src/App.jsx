// App.jsx — real-time backend + date range compare
import { useState, useEffect } from "react";
import { useAdData }      from "./hooks/useAdData";
import { fmt }            from "./utils/format";

import Header          from "./components/Header";
import KpiGrid         from "./components/KpiGrid";
import CompareKpi      from "./components/CompareKpi";
import SpendChart      from "./components/SpendChart";
import AgeGenderCharts from "./components/AgeGenderCharts";
import RegionTable     from "./components/RegionTable";
import ContentGrid     from "./components/ContentGrid";
import AdSetStats     from "./components/AdSetStats";
import DateRangePicker from "./components/DateRangePicker";

const PROJECTS = [
  { id:"motto", label:"Motto Scape" },
  { id:"mono",  label:"Mono"        },
  { id:"mews",  label:"Mews"        },
];

function today()     { return new Date().toISOString().slice(0,10); }
function monthStart(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; }
function budgetKey(pid,s,u){ return `budget_${pid}_${s}_${u}`; }

// คำนวณช่วงเวลาย้อนหลังตามจำนวนวันเดียวกัน
function prevRange(since, until) {
  const s = new Date(since);
  const u = new Date(until);
  const days = Math.round((u - s) / 86400000); // จำนวนวันที่เลือก
  const ps = new Date(s); ps.setDate(ps.getDate() - days - 1);
  const pu = new Date(s); pu.setDate(pu.getDate() - 1);
  return {
    since: ps.toISOString().slice(0,10),
    until: pu.toISOString().slice(0,10),
  };
}

export default function App() {
  const [projectId,   setProjectId]   = useState("motto");
  const [since,       setSince]       = useState(monthStart());
  const [until,       setUntil]       = useState(today());
  const [compareMode, setCompareMode] = useState(false);
  const [budget,      setBudgetState] = useState(0);

  // คำนวณช่วงเปรียบเทียบอัตโนมัติตามจำนวนวันที่เลือก
  const cmpRange = prevRange(since, until);

  useEffect(() => {
    const saved = localStorage.getItem(budgetKey(projectId, since, until));
    setBudgetState(saved ? Number(saved) : 0);
  }, [projectId, since, until]);

  function setBudget(val) {
    const n = Number(val) || 0;
    localStorage.setItem(budgetKey(projectId, since, until), n);
    setBudgetState(n);
  }

  // ดึงข้อมูลหลัก — ทุก endpoint พร้อมกัน
  const main = useAdData(projectId, since, until);
  const { waking } = main;
  const adsets = main.adsets ?? [];
  // ดึงข้อมูลเปรียบเทียบ — ย้อนหลังตามจำนวนวันที่เลือก
  const cmp  = useAdData(compareMode ? projectId : null, cmpRange.since, cmpRange.until);

  const project   = PROJECTS.find(p => p.id === projectId);
  const dateLabel = `${since} → ${until}`;

  return (
    <div className="app">
      <Header projectLabel={project.label} monthLabel={dateLabel} />

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <select className="toolbar-select" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <DateRangePicker
            since={since} until={until}
            onChange={(s,u) => { setSince(s); setUntil(u); setCompareMode(false); }}
          />
        </div>
        <div className="toolbar-right">
          <button
            className={`compare-btn ${compareMode?"active":""}`}
            onClick={() => setCompareMode(v => !v)}
          >
            เปรียบเทียบ
          </button>
          {compareMode && (
            <div className="date-group">
              <label className="date-label" style={{ fontSize:"11px", color:"var(--muted)" }}>
                เทียบกับ {cmpRange.since} → {cmpRange.until}
              </label>
            </div>
          )}
        </div>
      </div>

      <main className="main">
        {/* Loading */}
        {main.waking && !main.loading && (
          <div className="loading-bar" style={{background:"#FFF9DB",borderColor:"#F59F00",color:"#E67700"}}>
            ☕ กำลังปลุก server... รอสักครู่ประมาณ 30-50 วินาที
          </div>
        )}
        {main.loading && (
          <div className="loading-bar">⏳ กำลังดึงข้อมูลจาก Meta...</div>
        )}
        {main.error && (
          <div className="error-bar">❌ ดึงข้อมูลไม่สำเร็จ: {main.error}</div>
        )}

        {!main.loading && !main.error && (
          <>
            {compareMode && cmp.campaigns?.length > 0
              ? <CompareKpi
                  campaigns={main.campaigns} prevCampaigns={cmp.campaigns}
                  ads={main.ads}             prevAds={cmp.ads}
                  budget={budget}            onBudgetChange={setBudget} />
              : <KpiGrid
                  campaigns={main.campaigns} ads={main.ads}
                  budget={budget}            onBudgetChange={setBudget} />}
            <SpendChart      campaigns={main.campaigns} budget={budget} />
            <AgeGenderCharts audience={main.audience}   campaigns={main.campaigns} />
            <RegionTable     regions={main.regions}     audience={main.audience}  campaigns={main.campaigns} />
            <ContentGrid     ads={main.ads} projectId={projectId} />
            <AdSetStats      adsets={adsets} />
          </>
        )}
      </main>

      <footer className="footer">
        <span>{project.label} · {dateLabel}</span>
        <span>Chanuntorn Dashboard</span>
      </footer>
    </div>
  );
}
