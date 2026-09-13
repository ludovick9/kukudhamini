"use client";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Download, Printer } from "lucide-react";

import type { Farm, ReportData } from "@/domain/types";
import { Card, SectionHeading } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/format";
import { dateKeyInTimezone } from "@/lib/timezone";
import { useLanguage } from "@/lib/i18n/language-provider";
import { downloadExcel } from "@/lib/client-export";

const colors = [
  "#176b3b",
  "#d99038",
  "#65a978",
  "#e2ad5b",
  "#8cb8a0",
  "#a8c4b2",
];

const tooltip = {
  contentStyle: {
    border: "1px solid #dfe9e2",
    borderRadius: 12,
    fontSize: 12,
  },
  cursor: {
    stroke: "#b7cabb",
    strokeDasharray: "4 4",
  },
};

function money(value: number, currency: string) {
  return formatCurrency(value, currency);
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(data: ReportData): void {
  const rows: string[][] = [
    ["KukuDhamini Report"],
    ["Report period", data.range.start, data.range.end],
    [],

    ["Financial Summary"],
    ["Metric", "Amount"],
    ["Revenue", String(data.financial.revenue)],
    ["Cash received", String(data.financial.cashReceived)],
    ["Outstanding", String(data.financial.outstanding)],
    ["Expenses", String(data.financial.expenses)],
    ["Net profit", String(data.financial.profit)],
    ["Profit margin", `${data.financial.margin}%`],
    [],

    ["Sales Performance"],
    ["Metric", "Value"],
    ["Sales", String(data.sales.count)],
    ["Birds sold", String(data.sales.birdsSold)],
    ["Average sale", String(data.sales.averageSale)],
    ["Paid sales", String(data.sales.paid)],
    ["Partial sales", String(data.sales.partial)],
    ["Unpaid sales", String(data.sales.unpaid)],
    [],

    ["Batch Performance"],
    [
      "Batch",
      "Current Birds",
      "Birds Sold",
      "Revenue",
      "Expenses",
      "Profit",
      "Margin",
    ],
    ...data.batches.map((batch) => [
      batch.name,
      String(batch.currentBirds),
      String(batch.birdsSold),
      String(batch.revenue),
      String(batch.expenses),
      String(batch.profit),
      `${batch.margin}%`,
    ]),
    [],

    ["Expense Breakdown"],
    ["Category", "Amount", "Share"],
    ...data.expenses.byCategory.map((item) => [
      item.label,
      String(item.amount),
      `${item.percentage}%`,
    ]),
    [],

    ["Payment Methods"],
    ["Method", "Payments", "Amount"],
    ...data.paymentsByMethod.map((item) => [
      item.label.replaceAll("_", " "),
      String(item.count),
      String(item.amount),
    ]),
    [],

    ["Feed Analysis"],
    ["Metric", "Value"],
    ["Purchased (kg)", String(data.feed.purchasedKg)],
    ["Consumed (kg)", String(data.feed.consumedKg)],
    ["Feed cost", String(data.feed.cost)],
    ["Current stock (kg)", String(data.feed.stockKg)],
    [],

    ["Feed By Type"],
    ["Type", "Purchased (kg)", "Consumed (kg)", "Cost"],
    ...data.feed.byType.map((item) => [
      item.label,
      String(item.purchasedKg),
      String(item.consumedKg),
      String(item.cost),
    ]),
    [],

    ["Operational KPIs"],
    ["Metric", "Value"],
    ["Mortality rate", `${data.operations.mortalityRate}%`],
    ["Sales rate", `${data.operations.salesRate}%`],
    ["Remaining birds", String(data.operations.remainingBirds)],
    ["Active batches", String(data.operations.activeBatches)],
    ["Completed batches", String(data.operations.completedBatches)],
  ];

  const csv = rows
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `kukudhamini-report-${data.range.start}-to-${data.range.end}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Card className="report-chart-card">
      <div className="chart-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>

      {children}
    </Card>
  );
}

export function ReportManager({
  farm,
  data,
}: {
  farm: Farm;
  data: ReportData;
}) {
  const { translate: tr } = useLanguage();

  const [preset, setPreset] = useState("month");
  const [start, setStart] = useState(data.range.start);
  const [end, setEnd] = useState(data.range.end);

  const invalid = start > end;

  const apply = (next: string) => {
    setPreset(next);

    const endDate = dateKeyInTimezone(
      new Date(),
      farm.timezone
    );

    const [year, month, day] = endDate
      .split("-")
      .map(Number);

    const date = new Date(
      Date.UTC(year, month - 1, day)
    );

    if (next === "today") {
      date.setUTCDate(day);
    }

    if (next === "week") {
      date.setUTCDate(day - date.getUTCDay());
    }

    if (next === "month") {
      date.setUTCDate(1);
    }

    if (next === "last-month") {
      const lastMonthEnd = new Date(
        Date.UTC(year, month - 1, 0)
      );

      setStart(
        `${lastMonthEnd.getUTCFullYear()}-${String(
          lastMonthEnd.getUTCMonth() + 1
        ).padStart(2, "0")}-01`
      );

      setEnd(
        lastMonthEnd.toISOString().slice(0, 10)
      );

      return;
    }

    if (next === "year") {
      date.setUTCMonth(0, 1);
    }

    setStart(date.toISOString().slice(0, 10));
    setEnd(endDate);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {tr("Farm intelligence")}
          </p>

          <h1>{tr("Reports & analytics")}</h1>

          <p className="heading-subtitle">
            {tr(
              "A measured view of revenue, cash, costs, feed, and flock performance."
            )}
          </p>
        </div>

        <button
  type="button"
  className="button button-secondary"
  onClick={() => {
    downloadCsv(data);
  }}
>
  <Download size={16} />
  {tr("Export CSV")}
</button>
<button type="button" className="button button-secondary" onClick={() => downloadReportExcel(data)}><Download size={16} /> Excel</button>
<button type="button" className="button button-secondary" onClick={() => window.print()}><Printer size={16} /> Print</button>
      </div>

      <Card className="report-filters">
        <div className="report-filter-presets">
          {[
            ["today", "Today"],
            ["week", "This week"],
            ["month", "This month"],
            ["last-month", "Last month"],
            ["year", "This year"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={
                preset === value
                  ? "report-preset-active"
                  : ""
              }
              onClick={() => apply(value)}
            >
              {tr(label)}
            </button>
          ))}
        </div>

        <div className="report-date-fields">
          <label>
            {tr("Start date")}

            <input
              type="date"
              value={start}
              onChange={(event) => {
                setPreset("custom");
                setStart(event.target.value);
              }}
            />
          </label>

          <span>to</span>

          <label>
            {tr("End date")}

            <input
              type="date"
              value={end}
              onChange={(event) => {
                setPreset("custom");
                setEnd(event.target.value);
              }}
            />
          </label>

          <Link
            className={`button button-primary ${
              invalid ? "disabled-button" : ""
            }`}
            href={
              invalid
                ? "/reports"
                : `/reports?start=${start}&end=${end}`
            }
          >
            {tr("Apply range")}
          </Link>
        </div>

        {invalid && (
          <p className="field-error">
            {tr("Start date cannot be after end date.")}
          </p>
        )}

        <p className="report-range-note">
          <CalendarDays size={13} />

          {tr("Showing")} {data.range.start}{" "}
          {tr("through")} {data.range.end}
        </p>
      </Card>

      <div className="report-kpi-grid">
        <Card>
          <span>Revenue</span>
          <strong>
            {money(
              data.financial.revenue,
              farm.currency
            )}
          </strong>
          <small>Sales earned</small>
        </Card>

        <Card>
          <span>Cash received</span>
          <strong>
            {money(
              data.financial.cashReceived,
              farm.currency
            )}
          </strong>
          <small>Payments collected</small>
        </Card>

        <Card>
          <span>Outstanding</span>
          <strong>
            {money(
              data.financial.outstanding,
              farm.currency
            )}
          </strong>
          <small>Receivables</small>
        </Card>

        <Card>
          <span>Expenses</span>
          <strong>
            {money(
              data.financial.expenses,
              farm.currency
            )}
          </strong>
          <small>Recorded costs</small>
        </Card>

        <Card>
          <span>Net profit</span>
          <strong>
            {money(
              data.financial.profit,
              farm.currency
            )}
          </strong>
          <small>
            {data.financial.margin}% margin
          </small>
        </Card>
      </div>

      <div className="dashboard-grid charts-row">
        <ChartCard
          title="Revenue vs expenses"
          subtitle="Earned revenue, collected cash, and recorded costs"
        >
          <ResponsiveContainer
            width="100%"
            height={250}
          >
            <ComposedChart
              data={data.revenueTrend}
              margin={{
                top: 8,
                right: 8,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid
                vertical={false}
                stroke="#e7eee9"
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "#7b8c82",
                  fontSize: 10,
                }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "#7b8c82",
                  fontSize: 10,
                }}
                tickFormatter={(value) =>
                  `${value / 1000}k`
                }
              />

              <Tooltip
                {...tooltip}
                formatter={(value) =>
                  money(
                    Number(value),
                    farm.currency
                  )
                }
              />

              <Bar
                dataKey="revenue"
                fill="#65a978"
                radius={[4, 4, 0, 0]}
                barSize={17}
              />

              <Bar
                dataKey="expenses"
                fill="#e2ad5b"
                radius={[4, 4, 0, 0]}
                barSize={17}
              />

              <Line
                dataKey="cash"
                stroke="#176b3b"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Expenses by category"
          subtitle="Share of the selected period"
        >
          <ResponsiveContainer
            width="100%"
            height={250}
          >
            <PieChart>
              <Pie
                data={data.expenses.byCategory}
                dataKey="amount"
                nameKey="label"
                cx="50%"
                cy="48%"
                innerRadius={60}
                outerRadius={88}
                paddingAngle={3}
                stroke="none"
              >
                {data.expenses.byCategory.map(
                  (item, index) => (
                    <Cell
                      key={item.label}
                      fill={
                        colors[index % colors.length]
                      }
                    />
                  )
                )}
              </Pie>

              <Tooltip
                {...tooltip}
                formatter={(value) =>
                  money(
                    Number(value),
                    farm.currency
                  )
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="report-section-grid">
        <Card>
          <SectionHeading
            eyebrow="Sales performance"
            title="Sales & collection"
          />

          <div className="report-metric-list">
            <div>
              <span>Sales</span>
              <strong>
                {formatNumber(data.sales.count)}
              </strong>
            </div>

            <div>
              <span>Birds sold</span>
              <strong>
                {formatNumber(data.sales.birdsSold)}
              </strong>
            </div>

            <div>
              <span>Average sale</span>
              <strong>
                {money(
                  data.sales.averageSale,
                  farm.currency
                )}
              </strong>
            </div>

            <div>
              <span>Paid / partial / unpaid</span>
              <strong>
                {data.sales.paid} / {data.sales.partial} /{" "}
                {data.sales.unpaid}
              </strong>
            </div>

            <div>
              <span>Collection rate</span>
              <strong>
                {data.financial.revenue
                  ? `${(
                      (data.financial.cashReceived /
                        data.financial.revenue) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}
              </strong>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeading
            eyebrow="Feed cost"
            title="Feed analysis"
          />

          <div className="report-metric-list">
            <div>
              <span>Purchased</span>
              <strong>
                {formatNumber(data.feed.purchasedKg)} kg
              </strong>
            </div>

            <div>
              <span>Consumed</span>
              <strong>
                {formatNumber(data.feed.consumedKg)} kg
              </strong>
            </div>

            <div>
              <span>Feed cost</span>
              <strong>
                {money(
                  data.feed.cost,
                  farm.currency
                )}
              </strong>
            </div>

            <div>
              <span>Current stock</span>
              <strong>
                {formatNumber(data.feed.stockKg)} kg
              </strong>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeading
            eyebrow="Flock operations"
            title="Operational KPIs"
          />

          <div className="report-metric-list">
            <div>
              <span>Mortality</span>
              <strong>
                {data.operations.mortalityRate}%
              </strong>
            </div>

            <div>
              <span>Sales rate</span>
              <strong>
                {data.operations.salesRate}%
              </strong>
            </div>

            <div>
              <span>Remaining birds</span>
              <strong>
                {formatNumber(
                  data.operations.remainingBirds
                )}
              </strong>
            </div>

            <div>
              <span>Active / completed</span>
              <strong>
                {data.operations.activeBatches} /{" "}
                {data.operations.completedBatches}
              </strong>
            </div>
          </div>
        </Card>
      </div>

      <div className="report-section-grid">
        <Card>
          <SectionHeading
            eyebrow="Batch performance"
            title="Profitability by batch"
          />

          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Birds</th>
                  <th>Sold</th>
                  <th>Revenue</th>
                  <th>Expenses</th>
                  <th>Profit</th>
                  <th>Margin</th>
                </tr>
              </thead>

              <tbody>
                {data.batches.map((batch) => (
                  <tr key={batch.id}>
                    <td>
                      <Link
                        href={`/batches/${batch.id}`}
                      >
                        {batch.name}
                      </Link>
                    </td>

                    <td>
                      {formatNumber(
                        batch.currentBirds
                      )}
                    </td>

                    <td>
                      {formatNumber(
                        batch.birdsSold
                      )}
                    </td>

                    <td>
                      {money(
                        batch.revenue,
                        farm.currency
                      )}
                    </td>

                    <td>
                      {money(
                        batch.expenses,
                        farm.currency
                      )}
                    </td>

                    <td
                      className={
                        batch.profit >= 0
                          ? "metric-good"
                          : "metric-risk"
                      }
                    >
                      {money(
                        batch.profit,
                        farm.currency
                      )}
                    </td>

                    <td>{batch.margin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionHeading
            eyebrow="Cost structure"
            title="Expense breakdown"
          />

          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Share</th>
                </tr>
              </thead>

              <tbody>
                {data.expenses.byCategory.map(
                  (item) => (
                    <tr key={item.label}>
                      <td>{item.label}</td>

                      <td>
                        {money(
                          item.amount,
                          farm.currency
                        )}
                      </td>

                      <td>{item.percentage}%</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="report-section-grid">
        <Card>
          <SectionHeading
            eyebrow="Collections"
            title="Payment methods"
          />

          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Payments</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {data.paymentsByMethod.map(
                  (item) => (
                    <tr key={item.label}>
                      <td>
                        {item.label.replaceAll(
                          "_",
                          " "
                        )}
                      </td>

                      <td>{item.count}</td>

                      <td>
                        {money(
                          item.amount,
                          farm.currency
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionHeading
            eyebrow="Feed by type"
            title="Feed cost detail"
          />

          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Purchased</th>
                  <th>Consumed</th>
                  <th>Cost</th>
                </tr>
              </thead>

              <tbody>
                {data.feed.byType.map((item) => (
                  <tr key={item.label}>
                    <td>{item.label}</td>

                    <td>
                      {formatNumber(
                        item.purchasedKg
                      )}{" "}
                      kg
                    </td>

                    <td>
                      {formatNumber(
                        item.consumedKg
                      )}{" "}
                      kg
                    </td>

                    <td>
                      {money(
                        item.cost,
                        farm.currency
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function downloadReportExcel(data: ReportData): void {
  downloadExcel(`kukudhamini-report-${data.range.start}-to-${data.range.end}.xls`, [
    { Metric: "Revenue", Amount: data.financial.revenue },
    { Metric: "Cash received", Amount: data.financial.cashReceived },
    { Metric: "Outstanding", Amount: data.financial.outstanding },
    { Metric: "Expenses", Amount: data.financial.expenses },
    { Metric: "Net profit", Amount: data.financial.profit },
    { Metric: "Birds sold", Amount: data.sales.birdsSold },
    { Metric: "Feed purchased (kg)", Amount: data.feed.purchasedKg },
    { Metric: "Feed consumed (kg)", Amount: data.feed.consumedKg },
    { Metric: "Mortality rate", Amount: `${data.operations.mortalityRate}%` },
  ]);
}