/** Human-readable labels from `servicesOffered` JSON (§2.2 — `{ name }` entries or legacy strings). */
export function serviceLabelsFromServicesOffered(offered: unknown): string[] {
  if (!Array.isArray(offered)) return [];
  const names: string[] = [];
  for (const item of offered) {
    if (typeof item === "string") {
      const t = item.trim();
      if (t.length > 0) names.push(t);
      continue;
    }
    if (item && typeof item === "object" && "name" in item) {
      const n = (item as { name: unknown }).name;
      if (typeof n === "string" && n.trim().length > 0) names.push(n.trim());
    }
  }
  return names;
}
