import { ArrowUpRight, Construction, Plus } from "lucide-react";
import { Button, Card, EmptyState, SectionHeading } from "@/components/ui";

const pageCopy: Record<string, { eyebrow: string; title: string; description: string; action?: string }> = {
  Batches: { eyebrow: "Production cycle", title: "Chicken batches", description: "Track every flock from arrival to harvest with one clear view.", action: "Add batch" },
  Expenses: { eyebrow: "Farm finances", title: "Expenses", description: "Keep production costs visible and ready for better decisions.", action: "Add expense" },
  Feed: { eyebrow: "Inventory", title: "Feed management", description: "Monitor starter, grower, and finisher feed across the farm.", action: "Record feed" },
  "Medicine & Vaccines": { eyebrow: "Flock health", title: "Medicine & vaccines", description: "Keep farmer-entered health tasks and their history in one place.", action: "Add health task" },
  Mortality: { eyebrow: "Flock health", title: "Mortality", description: "Record losses consistently and spot changes in flock health early." },
  Sales: { eyebrow: "Farm revenue", title: "Sales", description: "Track birds sold, buyers, weights, and revenue by batch.", action: "Record sale" },
  Reports: { eyebrow: "Farm intelligence", title: "Reports", description: "Turn production records into practical decisions for your next cycle." },
  Notifications: { eyebrow: "Stay informed", title: "Notifications", description: "Your future notification center will gather farm tasks and alerts here." },
  Settings: { eyebrow: "Farm workspace", title: "Settings", description: "Shape KukuDhamini around your farm, preferences, and working rhythm." },
};

export function PlaceholderPage({ title }: { title: string }) {
  const copy = pageCopy[title] ?? pageCopy.Batches;
  return <><div className="page-heading"><div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="heading-subtitle">{copy.description}</p></div>{copy.action && <Button><Plus size={17} /> {copy.action}</Button>}</div><div className="placeholder-grid"><Card className="placeholder-main"><SectionHeading title="Workspace preview" action={<button className="text-link">View dashboard <ArrowUpRight size={14} /></button>} /><EmptyState title={`${copy.title} tools are coming next`} message="The Phase 1 foundation is ready. This space is intentionally prepared for the next data-backed module." /></Card><Card><div className="preview-label"><Construction size={18} /> Phase 1 preview</div><h3>Designed for the field</h3><p className="placeholder-note">Fast, calm, and clear on the farm. Real records will connect here in the next phase.</p><div className="preview-lines"><span /><span /><span /><span /></div></Card></div></>;
}