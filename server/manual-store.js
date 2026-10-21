import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { validDate, today } from "../src/utils/report.js";

export function validateEntry(body) {
  if (
    !["motto", "mono", "mews"].includes(body.project) ||
    body.platform !== "meta" ||
    !["group", "creative"].includes(body.scope)
  )
    throw new Error("โครงการ แพลตฟอร์ม หรือประเภทข้อมูลไม่ถูกต้อง");
  if (
    typeof body.name !== "string" ||
    !body.name.trim() ||
    body.name.length > 500 ||
    !validDate(body.date) ||
    body.date > today()
  )
    throw new Error("ชื่อหรือวันที่ไม่ถูกต้อง");
  for (const key of ["qualify", "nonQualify", "clickLine"])
    if (
      !Number.isSafeInteger(body[key]) ||
      body[key] < 0 ||
      body[key] > 100000000
    )
      throw new Error("จำนวนต้องเป็นจำนวนเต็มตั้งแต่ 0 ถึง 100,000,000");
  return { ...body, name: body.name.trim() };
}
export function createManualStore(filename) {
  if (filename !== ":memory:")
    mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS results (project TEXT, platform TEXT, scope TEXT, name TEXT, date TEXT,
    qualify INTEGER NOT NULL, nonQualify INTEGER NOT NULL, clickLine INTEGER NOT NULL, version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY(project,platform,scope,name,date));`);
  return {
    list(project) {
      return db
        .prepare(
          "SELECT * FROM results WHERE project=? ORDER BY date DESC, name",
        )
        .all(project);
    },
    save(body) {
      const e = validateEntry(body);
      db.exec("BEGIN IMMEDIATE");
      try {
        const current = db
          .prepare(
            "SELECT version FROM results WHERE project=? AND platform=? AND scope=? AND name=? AND date=?",
          )
          .get(e.project, e.platform, e.scope, e.name, e.date);
        if ((current?.version || 0) !== e.version) {
          const error = new Error("ข้อมูลถูกแก้ไขแล้ว กรุณาโหลดใหม่ก่อนบันทึก");
          error.status = 409;
          throw error;
        }
        db.prepare(
          `INSERT INTO results VALUES (?,?,?,?,?,?,?,?,1) ON CONFLICT(project,platform,scope,name,date) DO UPDATE SET qualify=excluded.qualify,nonQualify=excluded.nonQualify,clickLine=excluded.clickLine,version=results.version+1`,
        ).run(
          e.project,
          e.platform,
          e.scope,
          e.name,
          e.date,
          e.qualify,
          e.nonQualify,
          e.clickLine,
        );
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      return this.list(e.project);
    },
    close() {
      db.close();
    },
  };
}
