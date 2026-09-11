"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error(error);
  }, [error]);

  return <main className="page-content"><div className="batch-route-error"><div className="error-state"><strong>We couldn&apos;t load this workspace.</strong><span>Please try again. If the problem continues, check the farm connection.</span><Button type="button" onClick={() => reset()}>Try again</Button></div></div></main>;
}
