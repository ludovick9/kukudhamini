"use client";

import { useEffect } from "react";

const unavailableControls = new Set([
  "Export CSV",
  "View health log",
  "All batches",
  "Explore profitability",
  "Open inbox",
  "View all",
  "Manage feed",
  "Record",
]);

export function InertControlGuard() {
  useEffect(() => {
    const disableKnownControls = () => {
      document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        const label = button.textContent?.trim() ?? "";
        if (!unavailableControls.has(label)) return;
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
        button.title = "This action is not available in the current workspace.";
      });
    };

    disableKnownControls();
    const observer = new MutationObserver(disableKnownControls);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
