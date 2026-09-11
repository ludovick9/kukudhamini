import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BatchDetail } from "@/components/batch-detail";
import { getBatchDetails, getBatchHealthHistory, getFarmContext } from "@/services/farm-services";

export default async function BatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { farm, user } = await getFarmContext();
  const [batch, healthHistory] = await Promise.all([getBatchDetails(farm.id, id), getBatchHealthHistory(farm.id, id)]);
  if (!batch) notFound();
  return <AppShell farm={farm} user={user}><BatchDetail batch={batch} farm={farm} healthHistory={healthHistory} /></AppShell>;
}