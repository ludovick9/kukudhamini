export function formatCurrency(value: number, currency = "TZS") {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value).replace("TZS", "TZS ");
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-TZ").format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}