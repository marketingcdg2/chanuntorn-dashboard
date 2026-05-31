// hooks/useAdData.js — ดึงข้อมูลจาก backend พร้อม retry เมื่อ backend หลับ
import { useState, useEffect } from "react";

const BACKEND = "https://chanuntorn-backend.onrender.com";

const ACCOUNTS = {
  motto: "2067772447288424",
  mono:  "783833721188530",
  mews:  "1822065945093567",
};

export function useAdData(projectId, since, until) {
  const [campaigns, setCampaigns] = useState([]);
  const [ads,       setAds]       = useState([]);
  const [audience,  setAudience]  = useState([]);
  const [regions,   setRegions]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [waking,    setWaking]    = useState(false); // backend กำลังตื่น

  useEffect(() => {
    if (!projectId || !since || !until) return;
    const accountId = ACCOUNTS[projectId];
    if (!accountId) return;

    setLoading(true);
    setError(null);
    setWaking(false);

    const params  = `account_id=${accountId}&since=${since}&until=${until}`;
    const timeout = 60000; // รอ backend ตื่นสูงสุด 60 วินาที

    async function fetchWithWakeup(url) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
    }

    // ตรวจสอบว่า backend ตื่นไหม ถ้ายังหลับอยู่แสดง waking state
    fetch(`${BACKEND}/api/insights?${params}`)
      .then(() => setWaking(false))
      .catch(() => setWaking(true));

    Promise.all([
      fetchWithWakeup(`${BACKEND}/api/insights?${params}`),
      fetchWithWakeup(`${BACKEND}/api/ads?${params}`),
      fetchWithWakeup(`${BACKEND}/api/audience?${params}`),
      fetchWithWakeup(`${BACKEND}/api/regions?${params}`),
    ])
      .then(([ins, ads, aud, reg]) => {
        setCampaigns(ins.data || []);
        setAds(ads.data || []);
        setAudience(aud.data || []);
        setRegions(reg.data || []);
        setWaking(false);
      })
      .catch(err => {
        setError(err.message);
        setWaking(false);
      })
      .finally(() => setLoading(false));
  }, [projectId, since, until]);

  return { campaigns, ads, audience, regions, loading, error, waking };
}
