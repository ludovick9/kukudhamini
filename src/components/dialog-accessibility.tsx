"use client";

import { useEffect } from "react";

export function DialogAccessibility() {
  useEffect(() => {
    let previouslyFocused: HTMLElement | null = null;
    let activeDialog: HTMLElement | null = null;

    const sync = () => {
      const dialog = document.querySelector<HTMLElement>(".dialog-preview");
      if (!dialog || dialog === activeDialog) return;
      previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      activeDialog = dialog;
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.tabIndex = -1;
      dialog.focus();
    };

    const observer = new MutationObserver(() => {
      sync();
      if (!document.querySelector(".dialog-preview") && activeDialog) {
        previouslyFocused?.focus();
        previouslyFocused = null;
        activeDialog = null;
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !activeDialog) return;
      const cancel = Array.from(activeDialog.querySelectorAll<HTMLButtonElement>("button")).find((button) => /cancel|close/i.test(`${button.textContent ?? ""} ${button.getAttribute("aria-label") ?? ""}`));
      cancel?.click();
    };

    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("keydown", handleKeyDown);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
