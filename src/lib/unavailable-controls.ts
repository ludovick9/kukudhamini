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

export function isUnavailableControl(label: string) {
  return unavailableControls.has(label.trim());
}

export function unavailableControlProps(label: string) {
  const unavailable = isUnavailableControl(label);
  return unavailable
    ? { disabled: true, "aria-disabled": true, title: "This action is not available in the current workspace." }
    : {};
}