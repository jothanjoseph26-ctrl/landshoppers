/** Privacy-preserving label for buyer/leads lists (PRV-02). */
export function maskPersonName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Client";
  if (parts.length === 1) {
    const w = parts[0]!;
    return w.length <= 2 ? w : `${w.slice(0, 1)}***`;
  }
  const last = parts[parts.length - 1]!;
  return `${parts[0]} ${last.slice(0, 1)}.`;
}
