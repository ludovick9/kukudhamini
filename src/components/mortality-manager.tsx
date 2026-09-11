"use client";

import { useActionState } from "react";
import type { Batch, MortalityRecord } from "@/domain/types";
import { mortalityAction } from "@/app/mortality/actions";
import { Button, Card, EmptyState, FormField, SectionHeading } from "@/components/ui";
import { dateKeyInTimezone } from "@/lib/timezone";
import { useLanguage } from "@/lib/i18n/language-provider";

const initialState = { ok: false, message: "" };

export function MortalityManager({ records, batches, timezone }: { records: MortalityRecord[]; batches: Batch[]; timezone: string }) {
  const [state, action, pending] = useActionState(mortalityAction, initialState);
  const { translate: tr } = useLanguage();
  const activeBatches = batches.filter((batch) => batch.status === "active" && batch.currentBirds > 0);

  return <>
    <div className="page-heading"><div><p className="eyebrow">{tr("Flock health")}</p><h1>{tr("Mortality")}</h1><p className="heading-subtitle">{tr("Record losses accurately and keep available bird counts reliable.")}</p></div></div>
    <div className="settings-grid">
      <Card>
        <SectionHeading eyebrow={tr("New record")} title={tr("Record mortality")} />
        <form action={action} className="stack-form">
          <FormField label="Batch"><select name="batchId" required defaultValue=""><option value="" disabled>Select a batch</option>{activeBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.code} · {batch.currentBirds.toLocaleString()} available</option>)}</select></FormField>
          <div className="form-grid"><FormField label="Date"><input name="date" type="date" defaultValue={dateKeyInTimezone(new Date(), timezone)} required /></FormField><FormField label="Birds lost"><input name="quantity" type="number" min="1" step="1" required /></FormField></div>
          <FormField label="Cause (optional)"><input name="cause" maxLength={200} placeholder="e.g. illness, injury" /></FormField>
          <FormField label="Notes (optional)"><textarea name="notes" rows={3} maxLength={1000} /></FormField>
          {state.message && <p className={`form-feedback ${state.ok ? "success" : "error"}`} role="status">{state.message}</p>}
          <Button type="submit" disabled={pending || activeBatches.length === 0}>{pending ? tr("Saving...") : tr("Save mortality record")}</Button>
        </form>
        {activeBatches.length === 0 && <p className="settings-description">There are no active batches with available birds.</p>}
      </Card>
      <Card>
        <SectionHeading eyebrow="History" title="Recent records" />
        {records.length === 0 ? <EmptyState title="No mortality records" message="Record the first loss when it occurs to keep flock health data complete." /> : <div className="activity-list">{records.map((record) => <div className="activity-row" key={record.id}><div className="activity-icon activity-mortality">!</div><div><strong>{record.batchCode}</strong><span>{record.deaths.toLocaleString()} birds · {record.cause}</span></div><time>{record.date}</time></div>)}</div>}
      </Card>
    </div>
  </>;
}
