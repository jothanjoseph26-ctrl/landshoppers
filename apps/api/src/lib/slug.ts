import { randomUUID } from "node:crypto";

/** URL-safe slug from title + uniqueness suffix. */
export function slugifyUnique(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  const suffix = randomUUID().slice(0, 8);
  const slug = base.length > 0 ? `${base}-${suffix}` : `listing-${suffix}`;
  return slug;
}
