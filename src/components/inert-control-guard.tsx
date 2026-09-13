"use client";

import { useEffect } from "react";
import { isUnavailableControl } from "@/lib/unavailable-controls";

export function InertControlGuard() {
  useEffect(() => {
    let scheduled: number | undefined;
    const disableKnownControls = () => {
      document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        const label = button.textContent?.trim() ?? "";
        if (!isUnavailableControl(label)) return;
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
        button.title = "This action is not available in the current workspace.";
      });
    };

    const scheduleDisable = () => {
      if (scheduled !== undefined) window.clearTimeout(scheduled);
      scheduled = window.setTimeout(() => {
        scheduled = undefined;
        disableKnownControls();
      }, 0);
    };

    scheduleDisable();
    const observer = new MutationObserver(scheduleDisable);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (scheduled !== undefined) window.clearTimeout(scheduled);
    };
  }, []);

  return null;
}
