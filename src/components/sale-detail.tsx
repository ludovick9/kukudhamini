"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, Check, CreditCard, X } from "lucide-react";
import type { Farm, SaleDetails } from "@/domain/types";
import { paymentAction } from "@/app/sales/payment-actions";
import { Badge, Card, FormField, SectionHeading } from "@/components/ui";

const empty = { ok: false, message: "" };
function money(value: number, currency: string) { return new Intl.NumberFormat("en-TZ", { style: "currency", currency, maximumFractionDigits: 0 }).format(value).replace("TZS", "TZS "); }
function statusTone(status?: SaleDetails["paymentStatus"]) { return status === "PAID" ? "green" : status === "PARTIAL" ? "amber" : "red"; }
export function SaleDetail({
  farm,
  sale,
}: {
  farm: Farm;
  sale: SaleDetails;
}) {
  const [state, action, pending] = useActionState(paymentAction, empty);

  const status = sale.paymentStatus ?? "UNPAID";
  const paid = sale.paidAmount ?? 0;
  const balance = sale.balanceDue ?? sale.revenue;

  return (
    <>
      <div className="detail-back">
        <Link href="/sales">
          <ArrowLeft size={15} /> Back to sales
        </Link>
      </div>

      <div className="page-heading">
        <div>
          <p className="eyebrow">Sale detail</p>
          <h1>{sale.batchCode}</h1>
          <p className="heading-subtitle">
            {sale.buyer} · {sale.date}
          </p>
        </div>

        <Badge tone={statusTone(status)}>{status}</Badge>
      </div>

      <div className="detail-stat-grid">
        <Card>
          <span>Total revenue</span>
          <strong>{money(sale.revenue, farm.currency)}</strong>
          <small>{sale.birds.toLocaleString()} birds</small>
        </Card>

        <Card>
          <span>Paid</span>
          <strong>{money(paid, farm.currency)}</strong>
          <small>Cash received</small>
        </Card>

        <Card>
          <span>Outstanding</span>
          <strong>{money(balance, farm.currency)}</strong>
          <small>Receivable balance</small>
        </Card>

        <Card>
          <span>Pricing</span>
          <strong>
            {sale.pricingMode === "PER_BIRD" ? "Per bird" : "Per kg"}
          </strong>
          <small>
            {sale.totalWeightKg ? `${sale.totalWeightKg} kg` : ""}
          </small>
        </Card>
      </div>

      <div className="detail-grid">
        <Card>
          <SectionHeading
            eyebrow="Record payment"
            title="Add a payment"
          />

          <p className="heading-subtitle">
            Payments are retained as history and cannot exceed the outstanding
            balance.
          </p>

          <div className="form-feedback">
            <CreditCard size={15} />
            Outstanding: {money(balance, farm.currency)}
          </div>

          <form action={action} className="batch-form">
            <input
              type="hidden"
              name="saleId"
              value={sale.id}
            />

            <div className="form-grid">
              <FormField label="Amount">
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  max={balance}
                  step="0.01"
                  required
                />
              </FormField>

              <FormField label="Payment method">
                <select name="paymentMethod">
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="CREDIT">Credit</option>
                  <option value="OTHER">Other</option>
                </select>
              </FormField>

              <FormField label="Payment date">
                <input
                  name="paymentDate"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                />
              </FormField>

              <FormField label="Reference">
                <input
                  name="reference"
                  placeholder="Optional reference"
                />
              </FormField>
            </div>

            <FormField label="Notes">
              <textarea
                name="notes"
                rows={2}
              />
            </FormField>

            {state.message && (
              <div
                className={`form-feedback ${
                  state.ok
                    ? "feedback-success"
                    : "feedback-error"
                }`}
                role="status"
              >
                {state.ok ? (
                  <Check size={15} />
                ) : (
                  <X size={15} />
                )}

                {state.message}
              </div>
            )}

            <button
              className="button button-primary"
              disabled={pending || balance <= 0}
            >
              {pending ? "Saving..." : "Record payment"}
            </button>
          </form>
        </Card>

        <Card>
          <SectionHeading
            eyebrow="Payment history"
            title="Payments"
          />

          {sale.payments.length === 0 ? (
            <p className="detail-muted">
              No payments recorded. This sale is currently unpaid.
            </p>
          ) : (
            <div className="batch-activity-list">
              {sale.payments.map((payment) => (
                <div
                  className="batch-activity"
                  key={payment.id}
                >
                  <div className="activity-icon activity-sale">
                    <CreditCard size={15} />
                  </div>

                  <div>
                    <strong>
                      {money(payment.amount, farm.currency)}
                    </strong>

                    <span>
                      {payment.paymentMethod.replaceAll("_", " ")}
                      {payment.reference
                        ? ` · ${payment.reference}`
                        : ""}
                    </span>
                  </div>

                  <time>{payment.paymentDate}</time>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}