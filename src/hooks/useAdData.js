// hooks/useAdData.js — ดึงข้อมูลจาก backend แทนไฟล์ static
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

  useEffect(() => {
    if (!projectId || !since || !until) return;

    const accountId = ACCOUNTS[projectId];
    if (!accountId) return;

    setLoading(true);
    setError(null);

    const params = `account_id=${accountId}&since=${since}&until=${until}`;

    Promise.all([
      fetch(`${BACKEND}/api/insights?${params}`).then(r => r.json()),
      fetch(`${BACKEND}/api/ads?${params}`).then(r => r.json()),
      fetch(`${BACKEND}/api/audience?${params}`).then(r => r.json()),
      fetch(`${BACKEND}/api/regions?${params}`).then(r => r.json()),
    ])
      .then(([ins, ads, aud, reg]) => {
        setCampaigns(ins.data || []);
        setAds(ads.data || []);
        setAudience(aud.data || []);
        setRegions(reg.data || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId, since, until]);

  return { campaigns, ads, audience, regions, loading, error };
}
