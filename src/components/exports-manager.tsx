"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { Expense, FeedTransactionRecord, MortalityRecord, Sale } from "@/domain/types";
import { Button, Card, FormField, SectionHeading } from "@/components/ui";
import { downloadCsv, downloadExcel } from "@/lib/client-export";

function within(date: string, start: string, end: string) { return (!start || date >= start) && (!end || date <= end); }
export function ExportsManager({ expenses, feed, sales, mortality }: { expenses: Expense[]; feed: FeedTransactionRecord[]; sales: Sale[]; mortality: MortalityRecord[] }) {
  const [start, setStart] = useState(""); const [end, setEnd] = useState("");
  const datasets = [
    { name: "expenses", label: "Expenses", rows: expenses.filter((item) => within(item.date, start, end)).map((item) => ({ Date: item.date, Description: item.description, Category: item.category, Amount: item.amount, Supplier: item.supplier, Payment: item.paymentMethod ?? "", Batch: item.batchCode ?? "" })) },
    { name: "feed-transactions", label: "Feed transactions", rows: feed.filter((item) => within(item.date, start, end)).map((item) => ({ Date: item.date, Product: item.productName, Type: item.type, Quantity: item.quantity, Unit: item.unit, UnitPrice: item.unitPrice ?? "", Supplier: item.supplier ?? "", Batch: item.batchCode ?? "" })) },
    { name: "sales", label: "Sales", rows: sales.filter((item) => within(item.date, start, end)).map((item) => ({ Date: item.date, Batch: item.batchCode, Buyer: item.buyer, Birds: item.birds, WeightKg: item.totalWeightKg, Revenue: item.revenue, PaymentStatus: item.paymentStatus ?? "" })) },
    { name: "mortality", label: "Mortality", rows: mortality.filter((item) => within(item.date, start, end)).map((item) => ({ Date: item.date, Batch: item.batchCode, BirdsLost: item.deaths, Cause: item.cause })) },
  ];
  return <Card className="phase4-list-card"><SectionHeading eyebrow="Operational exports" title="Download farm records" /><div className="form-grid"><FormField label="Start date"><input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></FormField><FormField label="End date"><input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></FormField></div><div className="activity-list">{datasets.map((dataset) => <div className="activity-row" key={dataset.name}><div><strong>{dataset.label}</strong><span>{dataset.rows.length} records in selected range</span></div><div className="heading-actions"><Button variant="secondary" disabled={!dataset.rows.length} onClick={() => downloadCsv(`${dataset.name}.csv`, dataset.rows)}><Download size={15} /> CSV</Button><Button variant="secondary" disabled={!dataset.rows.length} onClick={() => downloadExcel(`${dataset.name}.xls`, dataset.rows)}>Excel</Button></div></div>)}</div></Card>;
}