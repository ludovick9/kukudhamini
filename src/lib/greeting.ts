export type GreetingPeriod = "morning" | "afternoon" | "evening";

export function greetingKeyForHour(hour: number): string {
  const period: GreetingPeriod = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  return `Good ${period}, {name}.`;
}