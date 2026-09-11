import assert from "node:assert/strict";
import test from "node:test";
import { dateKeyInTimezone } from "@/lib/timezone";

test("farm-local date can differ from UTC near midnight", () => {
  const timestamp = new Date("2026-09-10T23:30:00.000Z");
  assert.equal(dateKeyInTimezone(timestamp, "Africa/Dar_es_Salaam"), "2026-09-11");
  assert.equal(dateKeyInTimezone(timestamp, "America/New_York"), "2026-09-10");
});
