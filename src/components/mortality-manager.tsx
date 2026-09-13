"use client";

import { useActionState, useState } from "react";
import { Edit3, Trash2, X } from "lucide-react";
import type { Batch, MortalityRecord } from "@/domain/types";
import { deleteMortalityAction, mortalityAction } from "@/app/mortality/actions";
import { Button, Card, EmptyState, FormField, SectionHeading } from "@/components/ui";
import { dateKeyInTimezone } from "@/lib/timezone";
import { useLanguage } from "@/lib/i18n/language-provider";

const initialState = { ok: false, message: "" };

function MortalityForm({ record, batches, timezone, onClose }: { record?: MortalityRecord; batches: Batch[]; timezone: string; onClose: () => void }) {
  const [state, action, pending] = useActionState(mortalityAction, initialState);
  const selectedBatch = batches.find((batch) => batch.code === record?.batchCode);
  return <Card className="phase4-form"><div className="form-card-heading"><div><p className="eyebrow">Flock health</p><h2>{record ? "Edit mortality record" : "Record mortality"}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close mortality form"><X size={18} /></button></div><form action={action} className="stack-form"><input type="hidden" name="mortalityId" value={record?.id ?? ""} /><FormField label="Batch"><select name="batchId" required defaultValue={selectedBatch?.id ?? ""}><option value="" disabled>Select a batch</option>{batches.filter((batch) => batch.status === "active" && (batch.currentBirds > 0 || batch.id === selectedBatch?.id)).map((batch) => <option key={batch.id} value={batch.id}>{batch.code} · {batch.currentBirds.toLocaleString()} available</option>)}</select></FormField><div className="form-grid"><FormField label="Date"><input name="date" type="date" defaultValue={record?.date ?? dateKeyInTimezone(new Date(), timezone)} required /></FormField><FormField label="Birds lost"><input name="quantity" type="number" min="1" step="1" defaultValue={record?.deaths ?? ""} required /></FormField></div><FormField label="Cause (optional)"><input name="cause" maxLength={200} defaultValue={record?.cause ?? ""} placeholder="e.g. illness, injury" /></FormField><FormField label="Notes (optional)"><textarea name="notes" rows={3} maxLength={1000} /></FormField>{state.message && <p className={`form-feedback ${state.ok ? "success" : "error"}`} role="status">{state.message}</p>}<div className="form-actions"><Button type="submit" disabled={pending}>{pending ? "Saving..." : record ? "Save changes" : "Save mortality record"}</Button><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button></div></form></Card>;
}

function MortalityRow({ record, onEdit }: { record: MortalityRecord; onEdit: () => void }) {
  const [state, action, pending] = useActionState(deleteMortalityAction, initialState);
  function remove() { if (window.confirm(`Delete mortality record for ${record.batchCode}?`)) { const formData = new FormData(); formData.set("mortalityId", record.id); void action(formData); } }
  return <div className="activity-row"><div className="activity-icon activity-mortality">!</div><div><strong>{record.batchCode}</strong><span>{record.deaths.toLocaleString()} birds · {record.cause}</span></div><time>{record.date}</time><button type="button" className="icon-button" onClick={onEdit} aria-label={`Edit mortality record for ${record.batchCode}`}><Edit3 size={15} /></button><button type="button" className="icon-button" onClick={remove} disabled={pending} aria-label={`Delete mortality record for ${record.batchCode}`}><Trash2 size={15} /></button>{state.message && <small className="health-row-feedback">{state.message}</small>}</div>;
}

export function MortalityManager({ records, batches, timezone }: { records: MortalityRecord[]; batches: Batch[]; timezone: string }) {
  const { translate: tr } = useLanguage();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MortalityRecord>();
  const activeBatches = batches.filter((batch) => batch.status === "active" && batch.currentBirds > 0);
  function openNew() { setEditing(undefined); setFormOpen(true); }

  return <>
    <div className="page-heading"><div><p className="eyebrow">{tr("Flock health")}</p><h1>{tr("Mortality")}</h1><p className="heading-subtitle">{tr("Record losses accurately and keep available bird counts reliable.")}</p></div><Button onClick={openNew}>Record mortality</Button></div>
    {formOpen && <MortalityForm record={editing} batches={batches} timezone={timezone} onClose={() => setFormOpen(false)} />}
    <div className="settings-grid"><Card><SectionHeading eyebrow="History" title="Recent records" />{records.length === 0 ? <EmptyState title="No mortality records" message="Record the first loss when it occurs to keep flock health data complete." /> : <div className="activity-list">{records.map((record) => <MortalityRow key={record.id} record={record} onEdit={() => { setEditing(record); setFormOpen(true); }} />)}</div>}</Card></div>
    {activeBatches.length === 0 && !formOpen && <p className="settings-description">There are no active batches with available birds.</p>}</>;
}
