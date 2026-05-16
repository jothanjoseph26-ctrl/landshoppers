import {
  SubscriptionPlan,
  SubscriptionStatus,
  type Subscription,
} from "@landshoppers/db";

/** Product tiers for AgentOS shell + gating (maps DB plans). */
export type AgentPortalTier = "free" | "pro" | "elite";

export function paystackConfigured(): boolean {
  const pub = process.env["PAYSTACK_PUBLIC_KEY"]?.trim();
  const sec = process.env["PAYSTACK_SECRET_KEY"]?.trim();
  return Boolean(pub && sec);
}

function subscriptionIsPayingActive(sub: Pick<Subscription, "status"> | null | undefined): boolean {
  if (!sub) return false;
  return sub.status === SubscriptionStatus.active || sub.status === SubscriptionStatus.past_due;
}

/** Agent subscription: `agent_basic` → Pro, `agent_pro` → Elite in product language. */
export function tierFromAgentSubscription(
  sub: Pick<Subscription, "plan" | "status"> | null | undefined,
): AgentPortalTier {
  if (!sub || !subscriptionIsPayingActive(sub)) return "free";
  if (sub.plan === SubscriptionPlan.agent_pro) return "elite";
  if (sub.plan === SubscriptionPlan.agent_basic) return "pro";
  return "free";
}

/** Developer using `/v1/agent/*`: map developer plans to the same tier enum for shared UI. */
export function tierFromDeveloperSubscription(
  sub: Pick<Subscription, "plan" | "status"> | null | undefined,
): AgentPortalTier {
  if (!sub || !subscriptionIsPayingActive(sub)) return "free";
  if (sub.plan === SubscriptionPlan.developer_pro) return "elite";
  if (sub.plan === SubscriptionPlan.developer_basic) return "pro";
  return "free";
}

export type AgentPortalLimits = {
  maxActiveListings: number | null;
  maxLeadsPerMonth: number | null;
  maxAiDescriptionGenerationsPerDay: number | null;
  maxWhatsappConnections: number | null;
};

export function limitsForTier(tier: AgentPortalTier): AgentPortalLimits {
  switch (tier) {
    case "free":
      return {
        maxActiveListings: 5,
        maxLeadsPerMonth: 10,
        maxAiDescriptionGenerationsPerDay: 3,
        maxWhatsappConnections: 0,
      };
    case "pro":
      return {
        maxActiveListings: null,
        maxLeadsPerMonth: null,
        maxAiDescriptionGenerationsPerDay: null,
        maxWhatsappConnections: 1,
      };
    case "elite":
      return {
        maxActiveListings: null,
        maxLeadsPerMonth: null,
        maxAiDescriptionGenerationsPerDay: null,
        maxWhatsappConnections: 5,
      };
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}
