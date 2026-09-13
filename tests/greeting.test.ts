import test from "node:test";
import assert from "node:assert/strict";
import { greetingKeyForHour } from "../src/lib/greeting";

test("greeting uses morning for midnight through late morning", () => assert.equal(greetingKeyForHour(0), "Good morning, {name}."));
test("greeting uses afternoon from noon through late afternoon", () => assert.equal(greetingKeyForHour(12), "Good afternoon, {name}."));
test("greeting uses evening from six o'clock through midnight", () => assert.equal(greetingKeyForHour(18), "Good evening, {name}."));