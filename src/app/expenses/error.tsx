"use client";
import { ErrorState } from "@/components/ui";
export default function ExpensesError({ reset }: { reset: () => void }) { return <div className="batch-route-error"><ErrorState /><button className="button button-primary" onClick={reset}>Try again</button></div>; }