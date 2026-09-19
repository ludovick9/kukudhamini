"use client";

import { useEffect, useState } from "react";
import { createLocalRecordId, type OfflineEntity, type OfflineMutation } from "@/lib/offline/db";
import { hydrateOfflineData, pendingSyncCount, probeServer, queueOfflineMutation, syncPendingOperations } from "@/lib/offline/sync";

export function OfflineStatus({ farmId }: { farmId: string }) {
  const [online, setOnline] = useState(() => typeof navigator !== "undefined" && navigator.onLine);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [serverReachable, setServerReachable] = useState(true);
  const [syncFailed, setSyncFailed] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const refresh = async () => { const count = await pendingSyncCount(farmId); if (active) setPending(count); };
    const sync = async () => {
      if (active) setSyncing(true);
      const result = await syncPendingOperations();
      if (active) { setSyncFailed(result.failed > 0 || result.conflicts > 0); setServerReachable(!result.unavailable); setSyncing(false); }
      await refresh();
    };
    void refresh();
    void probeServer().then((reachable) => { if (active) setServerReachable(reachable); if (reachable) { void hydrateOfflineData(farmId).catch(() => undefined); void sync(); } });
    const onlineHandler = () => { setOnline(true); void sync(); };
    const offlineHandler = () => setOnline(false);
    const changeHandler = () => void refresh();
    const savedHandler = () => { setNotice("Saved offline"); window.setTimeout(() => setNotice(""), 3500); void refresh(); };
    const submitHandler = (event: Event) => {
      if (navigator.onLine) return;
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const formData = new FormData(form);
      const value = (name: string) => String(formData.get(name) ?? "");
      const serverId = value("batchId") || value("taskId") || value("expenseId") || undefined;
      let entity: OfflineEntity;
      let payload: Record<string, unknown>;
      if (formData.has("name") && formData.has("breed") && formData.has("initialBirdCount")) {
        entity = "batch";
        payload = { name: value("name"), breed: value("breed"), arrivalDate: value("arrivalDate"), initialBirdCount: value("initialBirdCount"), expectedHarvestDate: value("expectedHarvestDate"), status: value("status") || "ACTIVE", notes: value("notes") || undefined };
      } else if (formData.has("title") && formData.has("scheduledAt")) {
        entity = "healthTask";
        payload = { batchId: value("batchId") || undefined, title: value("title"), type: value("type") || "OTHER", scheduledAt: value("scheduledAt"), status: value("status") || "UPCOMING", instructions: value("instructions") || undefined, notes: value("notes") || undefined };
      } else if (formData.has("description") && formData.has("categoryId") && formData.has("amount")) {
        entity = "expense";
        payload = { categoryId: value("categoryId"), supplierId: value("supplierId") || undefined, batchId: value("batchId") || undefined, date: value("date"), description: value("description"), quantity: 1, unit: "item", unitPrice: value("amount"), paymentMethod: value("paymentMethod"), notes: value("notes") || undefined };
      } else if (formData.has("productId") && formData.has("quantity") && formData.has("type")) {
        entity = "feedTransaction";
        payload = { productId: value("productId"), supplierId: value("supplierId") || undefined, batchId: value("batchId") || undefined, type: value("type"), quantity: value("quantity"), unit: value("unit"), unitPrice: value("unitPrice") || undefined, date: value("date"), notes: value("notes") || undefined };
      } else if (formData.has("birdsSold") && formData.has("pricingMode")) {
        entity = "sale";
        payload = { batchId: value("batchId"), customerId: value("customerId") || undefined, date: value("date"), birdsSold: value("birdsSold"), totalWeight: value("totalWeight") || undefined, pricingMode: value("pricingMode"), pricePerKg: value("pricePerKg") || undefined, pricePerBird: value("pricePerBird") || undefined, notes: value("notes") || undefined };
      } else if (formData.has("saleId") && formData.has("paymentMethod") && formData.has("paymentDate")) {
        entity = "payment";
        payload = { saleId: value("saleId"), amount: value("amount"), paymentMethod: value("paymentMethod"), paymentDate: value("paymentDate"), reference: value("reference") || undefined, notes: value("notes") || undefined };
      } else if (formData.has("batchId") && formData.has("quantity") && formData.has("cause")) {
        entity = "mortality";
        payload = { batchId: value("batchId"), date: value("date"), quantity: value("quantity"), cause: value("cause") || undefined, notes: value("notes") || undefined };
      } else return;
      event.preventDefault();
      const operation: OfflineMutation = serverId ? "update" : "create";
      void queueOfflineMutation({ localId: serverId ?? createLocalRecordId(), serverId, farmId, entity, operation, payload });
    };
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    window.addEventListener("kukudhamini-sync-change", changeHandler);
    window.addEventListener("kukudhamini-offline-saved", savedHandler);
    document.addEventListener("submit", submitHandler, true);
    return () => { active = false; window.removeEventListener("online", onlineHandler); window.removeEventListener("offline", offlineHandler); window.removeEventListener("kukudhamini-sync-change", changeHandler); window.removeEventListener("kukudhamini-offline-saved", savedHandler); document.removeEventListener("submit", submitHandler, true); };
  }, [farmId]);

  const offline = !online || !serverReachable;
  const label = syncing ? `Syncing ${pending} change${pending === 1 ? "" : "s"}...` : syncFailed ? "Some changes could not be synchronized" : offline ? "Working offline - changes will sync when connected" : notice || (pending ? `${pending} change${pending === 1 ? "" : "s"} waiting to sync` : "All changes synced");
  return <div className={`offline-status ${offline ? "offline-status-offline" : "offline-status-online"}`} role="status"><span className="offline-status-dot" />{label}<button type="button" onClick={() => { setSyncFailed(false); setSyncing(true); void syncPendingOperations().then(async (result) => { setServerReachable(!result.unavailable); setSyncFailed(result.failed > 0 || result.conflicts > 0); setPending(await pendingSyncCount(farmId)); setSyncing(false); }); }} disabled={syncing || offline}>{syncing ? "..." : "Sync Now"}</button></div>;
}