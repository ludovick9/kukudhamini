import test from "node:test";
import assert from "node:assert/strict";

import * as farmServices from "../src/services/farm-services";
import * as databaseServices from "../src/services/database-services";

test("mutation APIs for edit and delete flows are exposed", () => {
  assert.equal(typeof farmServices.updateSale, "function");
  assert.equal(typeof farmServices.deleteSale, "function");
  assert.equal(typeof farmServices.updateMortality, "function");
  assert.equal(typeof farmServices.deleteMortality, "function");
  assert.equal(typeof farmServices.updateHealthTask, "function");
  assert.equal(typeof farmServices.deleteHealthTask, "function");
  assert.equal(typeof farmServices.updateFeedTransaction, "function");
  assert.equal(typeof farmServices.deleteFeedTransaction, "function");

  assert.equal(typeof databaseServices.deleteDatabaseHealthTask, "function");
  assert.equal(typeof databaseServices.updateDatabaseSale, "function");
  assert.equal(typeof databaseServices.deleteDatabaseSale, "function");
  assert.equal(typeof databaseServices.updateDatabaseFeedTransaction, "function");
  assert.equal(typeof databaseServices.deleteDatabaseFeedTransaction, "function");
});
