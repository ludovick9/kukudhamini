const FALLBACK_TIMEZONE = "Africa/Dar_es_Salaam";

export function safeTimezone(timezone?: string) {
  if (!timezone) return FALLBACK_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return timezone;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

export function dateKeyInTimezone(date: Date, timezone?: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: safeTimezone(timezone), year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatTimestamp(date: Date, timezone?: string, locale = "en-TZ") {
  return new Intl.DateTimeFormat(locale, { timeZone: safeTimezone(timezone), day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatLongDate(date: Date, timezone?: string, locale = "en-TZ") {
  return new Intl.DateTimeFormat(locale, { timeZone: safeTimezone(timezone), weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function dateOnlyKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
