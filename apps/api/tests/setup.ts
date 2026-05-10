import { afterEach } from "vitest";

import { fakePrisma, resetFakePrisma } from "./helpers/fake-prisma.js";
import { setRateLimiterStore } from "../src/lib/rate-limiter-store.js";

process.env["NODE_ENV"] = "test";
process.env["JWT_SECRET"] ??= "test-secret-min-16-chars-only-for-vitest";
process.env["DATABASE_URL"] ??= "postgresql://test:test@localhost:5432/test?schema=public";
process.env["DEV_OTP_CODE"] = "000000";
delete process.env["REDIS_URL"];

// Mock Prisma module so route handlers exercise the in-memory fake instead of real DB calls.
import { vi } from "vitest";
vi.mock("../src/lib/prisma.js", () => ({ prisma: fakePrisma }));

afterEach(() => {
  resetFakePrisma();
  setRateLimiterStore(null);
});
