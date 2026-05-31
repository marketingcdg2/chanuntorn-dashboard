// hooks/useBudget.js — เก็บงบใน localStorage แยกตาม project + month
import { useState } from "react";

const KEY = (projectId, month) => `budget_${projectId}_${month}`;

export function useBudget(projectId, month) {
  const [budget, setBudgetState] = useState(() => {
    const saved = localStorage.getItem(KEY(projectId, month));
    return saved ? Number(saved) : 0;
  });

  function setBudget(val) {
    const n = Number(val) || 0;
    localStorage.setItem(KEY(projectId, month), n);
    setBudgetState(n);
  }

  return [budget, setBudget];
}
