import { useEffect, useState } from "react";
export const API = import.meta.env.VITE_API_URL || "";
export async function api(path, options = {}) {
  const timeout = AbortSignal.timeout(120000);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout;
  const response = await fetch(API + path, { ...options, signal });
  const data = await response
    .json()
    .catch(() => ({ error: "API ยังไม่พร้อม กรุณาตรวจการติดตั้ง backend" }));
  if (!response.ok || data.error)
    throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}
export function useReport(project, since, until, revision) {
  const requestKey = JSON.stringify([project, since, until, revision]);
  const [state, setState] = useState({ requestKey: null });
  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const params = new URLSearchParams({ project, since, until });
    Promise.allSettled([
      api(`/api/report?${params}`, options),
      api(`/api/manual-results?project=${project}`, options),
      api(`/api/images?project=${project}`, options),
    ]).then(([report, manual, images]) => {
      if (controller.signal.aborted) return;
      setState({
        requestKey,
        loading: false,
        report: report.status === "fulfilled" ? report.value : null,
        error: report.status === "rejected" ? report.reason.message : "",
        entries: manual.status === "fulfilled" ? manual.value.data : [],
        manualError: manual.status === "rejected" ? manual.reason.message : "",
        writable: manual.status === "fulfilled" && manual.value.writable,
        images: images.status === "fulfilled" ? images.value.images : {},
        imageError:
          images.status === "rejected" ? "โหลดรูป Creative ไม่สำเร็จ" : "",
      });
    });
    return () => controller.abort();
  }, [project, since, until, revision, requestKey]);
  return state.requestKey === requestKey ? state : { loading: true };
}
