// hooks/useAdData.js
import { useState, useEffect } from "react";

const BACKEND = "https://chanuntorn-backend.onrender.com";

const ACCOUNTS = {
  motto: "2067772447288424",
  mono:  "783833721188530",
  mews:  "1822065945093567",
};

export function useAdData(projectId, since, until) {
  const [campaigns,   setCampaigns]   = useState([]);
  const [ads,         setAds]         = useState([]);
  const [audience,    setAudience]    = useState([]);
  const [regions,     setRegions]     = useState([]);
  const [adsets,      setAdsets]      = useState([]);
  const [adsetNames,  setAdsetNames]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [waking,      setWaking]      = useState(false);

  useEffect(() => {
    if (!projectId || !since || !until) return;
    const accountId = ACCOUNTS[projectId];
    if (!accountId) return;

    setLoading(true);
    setError(null);
    setWaking(false);

    const params = `account_id=${accountId}&since=${since}&until=${until}`;

    async function fetchOne(url) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      } catch (err) {
        throw err;
      }
    }

    // ตรวจ wakeup แยก ไม่ block การดึงข้อมูลหลัก
    fetchOne(`${BACKEND}/api/insights?${params}`)
      .then(() => setWaking(false))
      .catch(() => setWaking(true));

    Promise.allSettled([
      fetchOne(`${BACKEND}/api/insights?${params}`),
      fetchOne(`${BACKEND}/api/ads?${params}`),
      fetchOne(`${BACKEND}/api/audience?${params}`),
      fetchOne(`${BACKEND}/api/regions?${params}`),
      fetchOne(`${BACKEND}/api/adsets?${params}`),
      fetchOne(`${BACKEND}/api/adset-names?${params}`),
    ])
      .then(([ins, ads, aud, reg, adsets, adsetNames]) => {
        if (ins.status        === "fulfilled") setCampaigns(ins.value?.data || []);
        if (ads.status        === "fulfilled") setAds(ads.value?.data || []);
        if (aud.status        === "fulfilled") setAudience(aud.value?.data || []);
        if (reg.status        === "fulfilled") setRegions(reg.value?.data || []);
        if (adsets.status     === "fulfilled") setAdsets(adsets.value?.data || []);
        if (adsetNames.status === "fulfilled") setAdsetNames(adsetNames.value?.data || []);
        if (ins.status        === "rejected")  setError(ins.reason?.message || "ดึงข้อมูลไม่สำเร็จ");
        setWaking(false);
      })
      .finally(() => setLoading(false));
  }, [projectId, since, until]);

  return { campaigns, ads, audience, regions, adsets, adsetNames, loading, error, waking };
}
