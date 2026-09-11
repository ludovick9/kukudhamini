import { AppShell } from "@/components/app-shell";
import { ReportManager } from "@/components/report-manager";
import { getFarmContext, getReportData } from "@/services/farm-services";
import { dateKeyInTimezone } from "@/lib/timezone";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ start?: string; end?: string }> }) {
  const { farm, user } = await getFarmContext(); const params = await searchParams; const now = new Date();
  const today = dateKeyInTimezone(now, farm.timezone);
  const [year, month] = today.split("-").map(Number);
  const start = params.start ? new Date(`${params.start}T00:00:00Z`) : new Date(Date.UTC(year, month - 1, 1));
  const end = params.end ? new Date(`${params.end}T00:00:00Z`) : new Date(`${today}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return <AppShell farm={farm} user={user}><div className="batch-route-error"><div className="error-state"><strong>Invalid report range.</strong><span>Choose a start date on or before the end date.</span></div></div></AppShell>;
  return <AppShell farm={farm} user={user}><ReportManager farm={farm} data={await getReportData(farm.id, start, end)} /></AppShell>;
}