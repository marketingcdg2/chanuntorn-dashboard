import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express from "express";
import {
  groupRows,
  total,
  dailySeries,
  validDate,
} from "../src/utils/report.js";
import { createManualStore } from "../server/manual-store.js";
import { registerReportApi } from "../server/report-api.js";
const entry = {
  project: "motto",
  platform: "meta",
  scope: "group",
  name: "กลุ่ม A",
  date: "2026-10-20",
  qualify: 12,
  nonQualify: 8,
  clickLine: 5,
  version: 0,
};
test("duplicates aggregate by name, date and scope; weighted ratios use totals", () => {
  const rows = [
    { name: "กลุ่ม A", impressions: 100, clicks: 10, spend: 20 },
    { name: "กลุ่ม A", impressions: 900, clicks: 9, spend: 180 },
  ];
  const result = groupRows(
    rows,
    [
      entry,
      { ...entry, scope: "creative", qualify: 100 },
      { ...entry, date: "2026-09-20", qualify: 100 },
    ],
    "group",
    "2026-10-01",
    "2026-10-20",
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].qualify, 12);
  assert.equal(result[0].clickLine, 5);
  assert.equal(result[0].count, 2);
  assert.equal(total(result).ctr, 1.9);
  assert.equal(total(result).spend, 200);
});
test("manual-only names remain visible without advertising delivery", () => {
  assert.equal(
    groupRows([], [entry], "group", "2026-10-01", "2026-10-20")[0].qualify,
    12,
  );
});
test("daily graph fills missing dates and rejects invalid calendar dates", () => {
  assert.equal(
    dailySeries(
      [{ date: "2026-10-02", spend: 10 }],
      "2026-10-01",
      "2026-10-03",
    )[1].spend,
    10,
  );
  assert.equal(dailySeries([], "2026-10-01", "2026-10-03").length, 3);
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(validDate("2026-10-20"), true);
});
test("SQLite persists daily edits, prevents double counting and conflicting writes", () => {
  const dir = mkdtempSync(join(tmpdir(), "dashboard-test-"));
  const file = join(dir, "results.sqlite");
  let store = createManualStore(file);
  store.save(entry);
  assert.equal(store.list("motto")[0].qualify, 12);
  assert.throws(() => store.save(entry), /ถูกแก้ไข/);
  store.save({ ...entry, version: 1, qualify: 20 });
  assert.equal(store.list("motto").length, 1);
  store.save({ ...entry, project: "mono" });
  assert.equal(store.list("mono").length, 1);
  assert.throws(() => store.save({ ...entry, date: "2026-02-30" }), /วันที่/);
  assert.throws(() => store.save({ ...entry, qualify: -1 }), /จำนวน/);
  assert.throws(() => store.save({ ...entry, qualify: 1.5 }), /จำนวน/);
  store.close();
  store = createManualStore(file);
  assert.equal(store.list("motto")[0].qualify, 20);
  store.close();
  rmSync(dir, { recursive: true });
});
test("API validates requests, authorizes writes, follows pagination and returns actual daily data", async () => {
  const app = express();
  app.use(express.json());
  const store = createManualStore(":memory:");
  let calls = 0;
  registerReportApi(
    app,
    store,
    { FB_TOKEN: "test-token", DASHBOARD_WRITE_TOKEN: "test-write" },
    async (url) => {
      calls++;
      const u = new URL(url);
      const daily = u.searchParams.get("time_increment") === "1";
      return {
        ok: true,
        json: async () => ({
          data: [
            {
              ad_name: "Creative A",
              adset_name: "กลุ่ม A",
              campaign_name: "Campaign A",
              objective: "OUTCOME_AWARENESS",
              spend: "10",
              impressions: "100",
              clicks: "5",
              date_start: "2026-10-20",
              actions: [],
            },
          ],
          paging:
            daily && !u.searchParams.has("after")
              ? { next: `${u}&after=next` }
              : undefined,
        }),
      };
    },
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal(
      (
        await fetch(
          base + "/api/report?project=motto&since=bad&until=2026-10-20",
        )
      ).status,
      400,
    );
    assert.equal(
      (await fetch(base + "/api/manual-results?project=__proto__")).status,
      400,
    );
    const put = (body, token = "test-write") =>
      fetch(base + "/api/manual-results", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    assert.equal((await put(entry, "wrong")).status, 401);
    assert.equal((await put(entry)).status, 200);
    assert.equal((await put(entry)).status, 409);
    const data = await (
      await fetch(base + "/api/manual-results?project=motto")
    ).json();
    assert.equal(data.data[0].clickLine, 5);
    const report = await (
      await fetch(
        base + "/api/report?project=motto&since=2026-10-01&until=2026-10-20",
      )
    ).json();
    assert.equal(report.groups[0].spend, 10);
    assert.equal(report.daily.length, 2);
    assert.equal(calls, 5);
  } finally {
    server.close();
    store.close();
  }
});
