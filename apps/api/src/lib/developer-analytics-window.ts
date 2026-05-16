export type DeveloperAnalyticsPeriod = "week" | "month" | "quarter" | "all";

/** UTC window start for analytics queries (inclusive). */
export function developerAnalyticsWindowStart(period: DeveloperAnalyticsPeriod): Date {
  const d = new Date();
  if (period === "all") return new Date(0);
  if (period === "month") {
    d.setUTCMonth(d.getUTCMonth() - 1);
    return d;
  }
  if (period === "quarter") {
    d.setUTCMonth(d.getUTCMonth() - 3);
    return d;
  }
  d.setUTCDate(d.getUTCDate() - 7);
  return d;
}
