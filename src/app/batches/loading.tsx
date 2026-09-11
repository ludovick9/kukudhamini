import { LoadingState } from "@/components/ui";

export default function Loading() {
  return <CardLoading />;
}

function CardLoading() {
  return <div className="panel batch-loading"><LoadingState /></div>;
}