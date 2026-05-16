import { ServiceLeadStatus } from "@landshoppers/db";

import { ApiError } from "../errors.js";

/** Allowed transitions (§3.2 provider updates). Terminal: completed, cancelled, lost. */
const NEXT: Partial<Record<ServiceLeadStatus, ServiceLeadStatus[]>> = {
  [ServiceLeadStatus.pending]: [
    ServiceLeadStatus.responded,
    ServiceLeadStatus.quoted,
    ServiceLeadStatus.cancelled,
    ServiceLeadStatus.lost,
  ],
  [ServiceLeadStatus.responded]: [
    ServiceLeadStatus.quoted,
    ServiceLeadStatus.negotiating,
    ServiceLeadStatus.accepted,
    ServiceLeadStatus.cancelled,
    ServiceLeadStatus.lost,
  ],
  [ServiceLeadStatus.quoted]: [
    ServiceLeadStatus.negotiating,
    ServiceLeadStatus.accepted,
    ServiceLeadStatus.cancelled,
    ServiceLeadStatus.lost,
  ],
  [ServiceLeadStatus.negotiating]: [
    ServiceLeadStatus.quoted,
    ServiceLeadStatus.accepted,
    ServiceLeadStatus.cancelled,
    ServiceLeadStatus.lost,
  ],
  [ServiceLeadStatus.accepted]: [
    ServiceLeadStatus.completed,
    ServiceLeadStatus.cancelled,
    ServiceLeadStatus.lost,
  ],
};

export function assertServiceLeadStatusTransition(
  from: ServiceLeadStatus,
  to: ServiceLeadStatus,
): void {
  if (from === to) return;
  const allowed = NEXT[from];
  if (!allowed?.includes(to)) {
    throw new ApiError(
      409,
      "INVALID_LEAD_TRANSITION",
      `Cannot move lead from ${from} to ${to}`,
    );
  }
}
