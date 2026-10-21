import { useEffect, useRef, useState } from "react";
import { FIXED, METRICS, today, number } from "../utils/report";
import { api } from "../hooks/useReport";

export default function ResultDrawer({
  target,
  project,
  entries,
  writable,
  onClose,
  onSaved,
  endDate,
}) {
  const dialog = useRef(null);
  const initialDate = endDate < today() ? endDate : today();
  const [date, setDate] = useState(initialDate);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const history = entries
    .filter(
      (e) =>
        e.scope === target.scope &&
        e.name === target.name &&
        e.platform === "meta",
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const existing = history.find((e) => e.date === date);
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      FIXED.map((k) => [
        k,
        history.find((e) => e.date === initialDate)?.[k] || 0,
      ]),
    ),
  );
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  function selectDate(next) {
    setDate(next);
    const entry = history.find((e) => e.date === next);
    setValues(Object.fromEntries(FIXED.map((k) => [k, entry?.[k] || 0])));
    setError("");
  }
  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await api("/api/manual-results", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project,
          platform: "meta",
          scope: target.scope,
          name: target.name,
          date,
          ...Object.fromEntries(FIXED.map((k) => [k, Number(values[k])])),
          version: existing?.version || 0,
        }),
      });
      onSaved(response.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="drawer"
      onCancel={(e) => {
        if (saving) e.preventDefault();
        else onClose();
      }}
      aria-labelledby="drawer-title"
    >
      <header className="drawer-heading">
        <h2 id="drawer-title">บันทึกผลลัพธ์</h2>
        <button disabled={saving} onClick={onClose} aria-label="ปิด">
          ✕
        </button>
      </header>
      <p className="target">
        <span className="badge">
          {target.scope === "group" ? "Ad Group" : "Ad Creative"}
        </span>
        {target.name}
      </p>
      <form onSubmit={save}>
        <label className="field">
          วันที่เกิดผลลัพธ์
          <input
            required
            type="date"
            max={today()}
            value={date}
            disabled={saving}
            onChange={(e) => selectDate(e.target.value)}
          />
        </label>
        <div className="entry-grid">
          {FIXED.map((k) => (
            <label
              key={k}
              className={`field ${k === "clickLine" ? "wide" : ""}`}
            >
              {METRICS[k]}
              <input
                aria-label={METRICS[k]}
                required
                type="number"
                min="0"
                max="100000000"
                step="1"
                value={values[k]}
                disabled={saving}
                onChange={(e) => setValues({ ...values, [k]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <label className="field">
          รหัสบันทึกผล
          <input
            required
            type="password"
            autoComplete="off"
            value={token}
            disabled={saving}
            onChange={(e) => setToken(e.target.value)}
            placeholder="รหัสสำหรับผู้ดูแล"
          />
        </label>
        <p className="muted helper">
          {existing
            ? "แก้ไขยอดรวมของวันนี้ ไม่บวกซ้ำกับยอดเดิม"
            : "บันทึกยอดรวมของวันที่เลือก"}{" "}
          · Ad Group และ Ad Creative บันทึกแยกกัน
        </p>
        {!writable && (
          <p className="error">ยังไม่ได้เปิดการบันทึกบนเซิร์ฟเวอร์</p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary full" disabled={saving || !writable}>
          {saving ? "กำลังบันทึก…" : "บันทึกจำนวน"}
        </button>
      </form>
      <div className="history">
        <h3>รายการตามวันที่</h3>
        <p className="muted helper">คลิกวันที่เพื่อแก้ไขยอดของวันนั้น</p>
        <table>
          <thead>
            <tr>
              <th>วันที่</th>
              {FIXED.map((k) => (
                <th key={k}>{METRICS[k]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((e) => (
              <tr key={e.date}>
                <td>
                  <button
                    disabled={saving}
                    className="date-link"
                    onClick={() => selectDate(e.date)}
                  >
                    {e.date}
                  </button>
                </td>
                {FIXED.map((k) => (
                  <td key={k}>{number(e[k], k)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!history.length && <p className="empty">ยังไม่มีรายการบันทึก</p>}
      </div>
    </dialog>
  );
}
