import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  agentPortalContextDataSchema,
  agentPortalDashboardDataSchema,
} from "../src/contracts/agent-portal.js";
import { call } from "./helpers/app.js";
import { fakeTables } from "./helpers/fake-prisma.js";

type Tokens = { accessToken: string; user: { id: string; role: string } };

async function registerAgent(email: string): Promise<Tokens> {
  const res = await call<{ data: Tokens }>("/v1/auth/register", {
    method: "POST",
    body: { email, password: "Password123!", role: "agent" },
  });
  expect(res.status).toBe(201);
  return res.body.data;
}

async function registerDeveloper(email: string, companyName: string) {
  const res = await call<{ data: Tokens }>("/v1/auth/register", {
    method: "POST",
    body: { email, password: "Password123!", role: "developer", companyName },
  });
  expect(res.status).toBe(201);
  return res.body.data;
}

describe("/v1/agent portal (context + dashboard + tours)", () => {
  it("returns 401 for /v1/agent/context without Authorization", async () => {
    const res = await call("/v1/agent/context");
    expect(res.status).toBe(401);
  });

  it("returns context for an agent with free tier by default", async () => {
    const { accessToken } = await registerAgent("agent-ctx-1@example.test");

    const res = await call<{ data: { tier: string; persona: string; email: string } }>("/v1/agent/context", {
      token: accessToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.persona).toBe("agent");
    expect(res.body.data.tier).toBe("free");
    expect(res.body.data.email).toContain("@");
    expect(res.body.data.paystackConfigured).toBe(false);

    const parsed = agentPortalContextDataSchema.safeParse((res.body as { data: unknown }).data);
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.format())).toBe(true);
  });

  it("maps agent_basic subscription to pro tier in context + dashboard", async () => {
    const { accessToken, user } = await registerAgent("agent-tier-pro@example.test");
    const agent = fakeTables.agents.find((a) => a.userId === user.id);
    expect(agent).toBeTruthy();

    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    fakeTables.subscriptions.push({
      id: randomUUID(),
      agentId: agent!.id,
      developerId: null,
      plan: "agent_basic",
      status: "active",
      paystackSubCode: null,
      paystackCustomerId: null,
      currentPeriodStart: now,
      currentPeriodEnd: end,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const ctx = await call<{ data: { tier: string } }>("/v1/agent/context", { token: accessToken });
    expect(ctx.status).toBe(200);
    expect(ctx.body.data.tier).toBe("pro");

    const dash = await call<{ data: { tier: string; limits: { maxActiveListings: number | null } } }>(
      "/v1/agent/dashboard",
      { token: accessToken },
    );
    expect(dash.status).toBe(200);
    expect(dash.body.data.tier).toBe("pro");
    expect(dash.body.data.limits.maxActiveListings).toBeNull();

    const dashParsed = agentPortalDashboardDataSchema.safeParse(
      (dash.body as { data: unknown }).data,
    );
    expect(dashParsed.success, dashParsed.success ? "" : JSON.stringify(dashParsed.error.format())).toBe(
      true,
    );
  });

  it("maps agent_pro subscription to elite tier", async () => {
    const { accessToken, user } = await registerAgent("agent-tier-elite@example.test");
    const agent = fakeTables.agents.find((a) => a.userId === user.id);
    expect(agent).toBeTruthy();

    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    fakeTables.subscriptions.push({
      id: randomUUID(),
      agentId: agent!.id,
      developerId: null,
      plan: "agent_pro",
      status: "active",
      paystackSubCode: null,
      paystackCustomerId: null,
      currentPeriodStart: now,
      currentPeriodEnd: end,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const ctx = await call<{ data: { tier: string } }>("/v1/agent/context", { token: accessToken });
    expect(ctx.status).toBe(200);
    expect(ctx.body.data.tier).toBe("elite");
  });

  it("GET /v1/agent/tours?upcoming=true returns a list", async () => {
    const { accessToken } = await registerAgent("agent-tours-1@example.test");
    const res = await call<{ data: unknown[] }>("/v1/agent/tours?upcoming=true", { token: accessToken });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("developer may call agent dashboard with developer subscription tier mapping", async () => {
    const { accessToken, user } = await registerDeveloper("dev-agent-dash@example.test", "DevCo Dash");
    const dev = fakeTables.developers.find((d) => d.userId === user.id);
    expect(dev).toBeTruthy();

    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    fakeTables.subscriptions.push({
      id: randomUUID(),
      agentId: null,
      developerId: dev!.id,
      plan: "developer_pro",
      status: "active",
      paystackSubCode: null,
      paystackCustomerId: null,
      currentPeriodStart: now,
      currentPeriodEnd: end,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const ctx = await call<{ data: { persona: string; tier: string } }>("/v1/agent/context", {
      token: accessToken,
    });
    expect(ctx.status).toBe(200);
    expect(ctx.body.data.persona).toBe("developer");
    expect(ctx.body.data.tier).toBe("elite");

    const dash = await call<{ status: number }>("/v1/agent/dashboard", { token: accessToken });
    expect(dash.status).toBe(200);
  });

  it("buyer cannot access agent context", async () => {
    const buyer = await call<{ data: Tokens }>("/v1/auth/register", {
      method: "POST",
      body: { email: "buyer-no-agent@example.test", password: "Password123!", role: "buyer" },
    });
    expect(buyer.status).toBe(201);
    const res = await call("/v1/agent/context", { token: buyer.body.data.accessToken });
    expect(res.status).toBe(403);
  });
});

describe("/v1/agent portal (insights + messages)", () => {
  it("returns paginated insights", async () => {
    const { accessToken } = await registerAgent("agent-insights-1@example.test");
    const res = await call<{
      data: { items: { id: string; title: string }[] };
      meta: { page: number; total: number };
    }>("/v1/agent/insights?page=1&pageSize=10", { token: accessToken });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.meta.page).toBe(1);
  });

  it("sends a message, lists threads for recipient, and reads thread", async () => {
    const a = await registerAgent("agent-msg-a@example.test");
    const b = await registerAgent("agent-msg-b@example.test");

    const send = await call<{ data: { message: { threadId: string; content: string } } }>("/v1/agent/messages", {
      method: "POST",
      token: a.accessToken,
      body: { receiverId: b.user.id, content: "Hello from A" },
    });
    expect(send.status).toBe(201);
    const threadId = send.body.data.message.threadId;

    const threadsB = await call<{ data: { threadId: string; lastPreview: string }[] }>(
      "/v1/agent/messages/threads?page=1&pageSize=20",
      { token: b.accessToken },
    );
    expect(threadsB.status).toBe(200);
    expect(threadsB.body.data.some((t) => t.threadId === threadId)).toBe(true);
    expect(threadsB.body.data.find((t) => t.threadId === threadId)?.lastPreview).toContain("Hello from A");

    const msgs = await call<{ data: { content: string }[] }>(
      `/v1/agent/messages/threads/${threadId}?page=1&pageSize=20`,
      { token: b.accessToken },
    );
    expect(msgs.status).toBe(200);
    expect(msgs.body.data.some((m) => m.content === "Hello from A")).toBe(true);
  });

  it("returns 404 when user is not a thread participant", async () => {
    const a = await registerAgent("agent-msg-part-a@example.test");
    const b = await registerAgent("agent-msg-part-b@example.test");
    const c = await registerAgent("agent-msg-part-c@example.test");

    const send = await call("/v1/agent/messages", {
      method: "POST",
      token: a.accessToken,
      body: { receiverId: b.user.id, content: "private" },
    });
    expect(send.status).toBe(201);
    const threadId = (send.body as { data: { message: { threadId: string } } }).data.message.threadId;

    const peek = await call(`/v1/agent/messages/threads/${threadId}?page=1&pageSize=10`, {
      token: c.accessToken,
    });
    expect(peek.status).toBe(404);
  });
});
