"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Edit3,
  Plus,
  Search,
  Sprout,
  Trash2,
  X,
} from "lucide-react";

import type { Batch, BatchDetails, Farm } from "@/domain/types";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  SectionHeading,
} from "@/components/ui";

import {
  changeBatchStatusAction,
  createBatchAction,
  deleteBatchAction,
  updateBatchAction,
  type BatchActionState,
} from "@/app/batches/actions";
import { batchInputSchema } from "@/lib/validation/database";
import { createLocalRecordId } from "@/lib/offline/db";
import { getOfflineRecords, probeServer, queueOfflineMutation } from "@/lib/offline/sync";

const emptyState: BatchActionState = {
  ok: false,
  message: "",
};

type DisplayBatch = Batch & { syncStatus?: "pending" | "syncing" | "failed" | "synced" };

function localBatchFromRecord(record: { localId: string; data: Record<string, unknown>; syncStatus: DisplayBatch["syncStatus"] }): DisplayBatch {
  const data = record.data;
  const arrivalDate = String(data.arrivalDate);
  const harvestDate = String(data.expectedHarvestDate);
  const initialBirds = Number(data.initialBirdCount);
  const status = String(data.status).toLowerCase() as Batch["status"];
  const today = Date.now();
  const arrival = new Date(arrivalDate).getTime();
  const harvest = new Date(harvestDate).getTime();
  return {
    id: record.localId,
    code: String(data.name).toUpperCase().replaceAll(" ", "-"),
    name: String(data.name),
    breed: String(data.breed),
    arrivalDate: arrivalDate.slice(0, 10),
    ageDays: Number.isFinite(arrival) ? Math.max(0, Math.floor((today - arrival) / 86400000)) : 0,
    initialBirds,
    currentBirds: initialBirds,
    mortality: 0,
    mortalityRate: 0,
    harvestDate: harvestDate.slice(0, 10),
    daysRemaining: Number.isFinite(harvest) ? Math.max(0, Math.ceil((harvest - today) / 86400000)) : 0,
    status,
    syncStatus: record.syncStatus,
  };
}

function statusTone(status: Batch["status"]) {
  return status === "active"
    ? "green"
    : status === "completed"
      ? "amber"
      : "neutral";
}

function statusLabel(status: Batch["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function Feedback({ state }: { state: BatchActionState }) {
  if (!state.message) return null;

  return (
    <div
      className={`form-feedback ${
        state.ok ? "feedback-success" : "feedback-error"
      }`}
      role="status"
    >
      {state.ok ? <Check size={15} /> : <X size={15} />}
      {state.message}
    </div>
  );
}

export function BatchForm({
  batch,
  farm,
  onClose,
}: {
  batch?: Batch | BatchDetails;
  farm: Farm;
  onClose?: () => void;
}) {
  const action = batch ? updateBatchAction : createBatchAction;

  const [state, formAction, pending] = useActionState(
    action,
    emptyState,
  );
  const [offlineMessage, setOfflineMessage] = useState("");

  const inputError = (field: string) =>
    state.fieldErrors?.[field];

  const lockedInitialCount = Boolean(
    batch && batch.currentBirds < batch.initialBirds,
  );

  const existingNotes =
    batch && "notes" in batch ? batch.notes : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    void (async () => {
      if (await probeServer()) {
        formAction(formData);
        return;
      }
      const payload = {
        name: String(formData.get("name") ?? ""),
        breed: String(formData.get("breed") ?? ""),
        arrivalDate: String(formData.get("arrivalDate") ?? ""),
        initialBirdCount: String(formData.get("initialBirdCount") ?? ""),
        expectedHarvestDate: String(formData.get("expectedHarvestDate") ?? ""),
        status: String(formData.get("status") ?? "ACTIVE"),
        notes: String(formData.get("notes") ?? "") || undefined,
      };
      const validation = batchInputSchema.safeParse(payload);
      if (!validation.success) {
        setOfflineMessage(validation.error.issues[0]?.message ?? "Please review the batch details.");
        return;
      }
      if (batch) {
        setOfflineMessage("Editing batches offline is not available yet.");
        return;
      }
      await queueOfflineMutation({ farmId: farm.id, entity: "batch", operation: "create", localId: createLocalRecordId(), payload });
      setOfflineMessage("Batch saved on this device. It will sync when you're online.");
    })();
  }

  return (
    <Card
      className="batch-form-card"
      id={batch ? "edit-batch" : "new-batch"}
    >
      <div className="form-card-heading">
        <div>
          <p className="eyebrow">
            {batch ? "Batch details" : "Production cycle"}
          </p>

          <h2>
            {batch ? `Edit ${batch.code}` : "New batch"}
          </h2>

          <p>
            {batch
              ? "Update planning details without rewriting historical records."
              : "Set up a flock with the dates and numbers your farm team will use."}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            className="icon-button form-close"
            onClick={onClose}
            aria-label="Close batch form"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <Feedback state={offlineMessage ? { ok: true, message: offlineMessage } : state} />

      <form action={formAction} className="batch-form" onSubmitCapture={(event) => { void handleSubmit(event); }}>
        <input
          type="hidden"
          name="batchId"
          value={batch?.id ?? ""}
        />

        <div className="form-grid">
          <FormField
            label="Batch name / code"
            error={inputError("name")}
          >
            <input
              name="name"
              defaultValue={batch?.name ?? ""}
              placeholder="e.g. BATCH-004"
              required
            />
          </FormField>

          <FormField
            label="Breed"
            error={inputError("breed")}
          >
            <input
              name="breed"
              defaultValue={batch?.breed ?? "Cobb 500"}
              placeholder="e.g. Cobb 500"
              required
            />
          </FormField>

          <FormField
            label="Start date"
            error={inputError("arrivalDate")}
          >
            <input
              type="date"
              name="arrivalDate"
              defaultValue={
                batch?.arrivalDate ?? "2026-09-09"
              }
              required
            />
          </FormField>

          <FormField
            label="Initial birds"
            hint={
              lockedInitialCount
                ? "Locked because this batch has historical records."
                : undefined
            }
            error={inputError("initialBirdCount")}
          >
            <input
              type="number"
              name="initialBirdCount"
              min="1"
              defaultValue={batch?.initialBirds ?? ""}
              disabled={lockedInitialCount}
              required
            />

            {lockedInitialCount && (
              <input
                type="hidden"
                name="initialBirdCount"
                value={batch?.initialBirds}
              />
            )}
          </FormField>

          <FormField
            label="Expected harvest"
            error={inputError("expectedHarvestDate")}
          >
            <input
              type="date"
              name="expectedHarvestDate"
              defaultValue={
                batch?.harvestDate ?? "2026-10-20"
              }
              required
            />
          </FormField>

          <FormField
            label="Status"
            error={inputError("status")}
          >
            <select
              name="status"
              defaultValue={
                batch?.status.toUpperCase() ?? "ACTIVE"
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </FormField>
        </div>

        <FormField
          label="Notes"
          hint={`Currency: ${farm.currency}`}
          error={inputError("notes")}
        >
          <textarea
            name="notes"
            defaultValue={existingNotes}
            placeholder="Optional farm notes"
            rows={3}
          />
        </FormField>

        <div className="form-actions">
          <button
            className="button button-primary"
            type="submit"
            disabled={pending}
          >
            {pending
              ? "Saving..."
              : batch
                ? "Save changes"
                : "Create batch"}
          </button>

          {onClose && (
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

function BatchRow({
  batch,
  onEdit,
  onStatus,
  onDelete,
}: {
  batch: DisplayBatch;
  onEdit: (batch: Batch) => void;
  onStatus: (
    batch: Batch,
    status: "COMPLETED" | "ARCHIVED",
  ) => void;
  onDelete: (batch: Batch) => void;
}) {
  const harvestState =
    batch.daysRemaining < 0
      ? "Passed"
      : batch.daysRemaining === 0
        ? "Today"
        : `${batch.daysRemaining} days`;

  return (
    <div className="batch-management-row">
      <div className="batch-row-identity">
        <div className="batch-avatar">
          <Sprout size={15} />
        </div>

        <div>
          <Link
            href={`/batches/${batch.id}`}
            className="batch-code-link"
          >
            {batch.code}
          </Link>

          <span>
            {batch.name} <i /> {batch.breed}
          </span>
        </div>
      </div>

      <div className="batch-data">
        <span className="mobile-data-label">Birds</span>
        <strong>
          {batch.currentBirds.toLocaleString()}
        </strong>
        <small>
          of {batch.initialBirds.toLocaleString()}
        </small>
      </div>

      <div className="batch-data">
        <span className="mobile-data-label">Mortality</span>

        <strong
          className={
            batch.mortalityRate > 2
              ? "metric-risk"
              : ""
          }
        >
          {batch.mortalityRate}%
        </strong>

        <small>{batch.mortality} lost</small>
      </div>

      <div className="batch-data">
        <span className="mobile-data-label">Age</span>
        <strong>Day {batch.ageDays}</strong>
        <small>started {batch.arrivalDate}</small>
      </div>

      <div className="batch-data">
        <span className="mobile-data-label">Harvest</span>

        <strong
          className={
            batch.daysRemaining <= 21
              ? "metric-soon"
              : ""
          }
        >
          {harvestState}
        </strong>

        <small>{batch.harvestDate}</small>
      </div>

      <Badge tone={statusTone(batch.status)}>
        {statusLabel(batch.status)}
      </Badge>

      {batch.syncStatus && batch.syncStatus !== "synced" && (
        <span className="badge badge-amber">Pending sync</span>
      )}

      <div className="batch-row-actions">
        <Link
          href={`/batches/${batch.id}`}
          className="icon-button"
          aria-label={`View ${batch.code}`}
        >
          <ArrowRight size={16} />
        </Link>

        <button
          type="button"
          className="icon-button"
          onClick={() => onEdit(batch)}
          aria-label={`Edit ${batch.code}`}
        >
          <Edit3 size={16} />
        </button>

        <button
          type="button"
          className="icon-button"
          onClick={() => onDelete(batch)}
          aria-label={`Delete ${batch.code}`}
        >
          <Trash2 size={16} />
        </button>

        {batch.status === "active" && (
          <button
            type="button"
            className="row-action-text"
            onClick={() =>
              onStatus(batch, "COMPLETED")
            }
          >
            Complete
          </button>
        )}

        {batch.status === "completed" && (
          <button
            type="button"
            className="row-action-text"
            onClick={() =>
              onStatus(batch, "ARCHIVED")
            }
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
}

export function BatchManager({
  batches,
  farm,
}: {
  batches: Batch[];
  farm: Farm;
}) {
  const [query, setQuery] = useState("");
  const [localBatches, setLocalBatches] = useState<DisplayBatch[]>([]);

  const refreshLocalBatches = useCallback(async () => {
    const records = await getOfflineRecords(farm.id, "batch");
    setLocalBatches(records.map((record) => localBatchFromRecord(record)));
  }, [farm.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshLocalBatches(), 0);
    window.addEventListener("kukudhamini-sync-change", refreshLocalBatches);
    return () => { window.clearTimeout(timer); window.removeEventListener("kukudhamini-sync-change", refreshLocalBatches); };
  }, [refreshLocalBatches]);

  const allBatches: DisplayBatch[] = [...batches, ...localBatches.filter((localBatch) => !batches.some((batch) => batch.id === localBatch.id))];

  const [statusFilter, setStatusFilter] =
    useState<Batch["status"] | "all">("all");

  const [showCreate, setShowCreate] =
    useState(false);

  const [editing, setEditing] =
    useState<Batch | undefined>();

  const [confirming, setConfirming] =
    useState<{
      batch: Batch;
      status: "COMPLETED" | "ARCHIVED";
    }>();

  const [deleting, setDeleting] =
    useState<Batch | undefined>();

  const [
    statusState,
    statusAction,
    statusPending,
  ] = useActionState(
    changeBatchStatusAction,
    emptyState,
  );

  const [
    deleteState,
    deleteAction,
    deletePending,
  ] = useActionState(
    deleteBatchAction,
    emptyState,
  );

  const filtered = allBatches.filter((batch) => {
    const matchesQuery =
      `${batch.code} ${batch.name} ${batch.breed}`
        .toLowerCase()
        .includes(query.toLowerCase());

    return (
      matchesQuery &&
      (statusFilter === "all" ||
        batch.status === statusFilter)
    );
  });

  const activeCount = allBatches.filter(
    (batch) => batch.status === "active",
  ).length;

  const totalBirds = allBatches
    .filter((batch) => batch.status === "active")
    .reduce(
      (sum, batch) => sum + batch.currentBirds,
      0,
    );

  const closeForms = () => {
    setShowCreate(false);
    setEditing(undefined);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Production cycle</p>

          <h1>Chicken batches</h1>

          <p className="heading-subtitle">
            Every flock, from arrival to harvest, in one
            clear view.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing(undefined);
            setShowCreate(true);
          }}
        >
          <Plus size={17} /> New batch
        </Button>
      </div>

      <div className="batch-summary-grid">
        <Card>
          <span>Active batches</span>
          <strong>{activeCount}</strong>
          <small>Currently growing</small>
        </Card>

        <Card>
          <span>Active birds</span>

          <strong>
            {totalBirds.toLocaleString()}
          </strong>

          <small>After mortality and sales</small>
        </Card>

        <Card>
          <span>Nearest harvest</span>

          <strong>
            {allBatches
              .filter(
                (batch) => batch.status === "active",
              )
              .sort(
                (a, b) =>
                  a.daysRemaining -
                  b.daysRemaining,
              )[0]?.daysRemaining ?? "-"}{" "}
            <small>days</small>
          </strong>

          <small>Planning window</small>
        </Card>
      </div>

      {showCreate && (
        <BatchForm
          farm={farm}
          onClose={closeForms}
        />
      )}

      {editing && (
        <BatchForm
          batch={editing}
          farm={farm}
          onClose={closeForms}
        />
      )}

      <Card className="batch-list-card">
        <SectionHeading
          eyebrow="Flock register"
          title="All batches"
          action={
            <div className="batch-list-meta">
              {filtered.length} shown
              <CalendarDays size={14} />
            </div>
          }
        />

        <div className="batch-toolbar">
          <label className="search-field">
            <Search size={16} />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search batches"
              aria-label="Search batches"
            />
          </label>

          <label className="filter-field">
            <span>Status</span>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | Batch["status"]
                    | "all",
                )
              }
              aria-label="Filter by status"
            >
              <option value="all">
                All statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="archived">
                Archived
              </option>
            </select>

            <ChevronDown size={14} />
          </label>
        </div>

        <Feedback state={statusState} />
        <Feedback state={deleteState} />

        {filtered.length === 0 ? (
          <EmptyState
            title="No batches match"
            message="Try a different search or status filter, or create a new production batch."
            action={
              <Button
                onClick={() =>
                  setShowCreate(true)
                }
              >
                <Plus size={16} /> New batch
              </Button>
            }
          />
        ) : (
          <div className="batch-management-list">
            {filtered.map((batch) => (
              <BatchRow
                key={batch.id}
                batch={batch}
                onEdit={(selected) => {
                  setShowCreate(false);
                  setEditing(selected);
                }}
                onStatus={(batch, status) =>
                  setConfirming({
                    batch,
                    status,
                  })
                }
                onDelete={(selected) => {
                  closeForms();
                  setDeleting(selected);
                }}
              />
            ))}
          </div>
        )}
      </Card>

      {confirming && (
        <div className="confirm-overlay">
          <div className="dialog-preview">
            <div className="dialog-icon">!</div>

            <h3>
              {confirming.status === "COMPLETED"
                ? "Complete this batch?"
                : "Archive this batch?"}
            </h3>

            <p>
              {confirming.status === "COMPLETED"
                ? "The batch will remain in your records but will no longer appear as active."
                : "The batch will remain available for historical records and reports."}
            </p>

            <form
              action={statusAction}
              onSubmit={() =>
                setConfirming(undefined)
              }
            >
              <input
                type="hidden"
                name="batchId"
                value={confirming.batch.id}
              />

              <input
                type="hidden"
                name="status"
                value={confirming.status}
              />

              <div className="dialog-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setConfirming(undefined)
                  }
                >
                  Cancel
                </Button>

                <button
                  className="button button-primary"
                  type="submit"
                  disabled={statusPending}
                >
                  {statusPending
                    ? "Saving..."
                    : confirming.status ===
                        "COMPLETED"
                      ? "Complete batch"
                      : "Archive batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleting && (
        <div className="confirm-overlay">
          <div className="dialog-preview">
            <div className="dialog-icon">!</div>

            <h3>Delete this batch?</h3>

            <p>
              This will permanently remove{" "}
              <strong>{deleting.code}</strong> if it has
              no historical records. Batches with sales,
              mortality, expenses, feed, or health records
              cannot be deleted and should be archived
              instead.
            </p>

            <form
              action={deleteAction}
              onSubmit={() =>
                setDeleting(undefined)
              }
            >
              <input
                type="hidden"
                name="batchId"
                value={deleting.id}
              />

              <div className="dialog-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setDeleting(undefined)
                  }
                >
                  Cancel
                </Button>

                <button
                  className="button button-primary"
                  type="submit"
                  disabled={deletePending}
                >
                  {deletePending
                    ? "Deleting..."
                    : "Delete batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}