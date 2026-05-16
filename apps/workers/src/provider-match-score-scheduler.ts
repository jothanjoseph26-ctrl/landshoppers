import { Queue } from "bullmq";
import type { Redis } from "ioredis";

import { QUEUE_PROVIDER_MATCH_SCORE } from "./constants.js";

const REPEATABLE_JOB_NAME = "provider-match-score-full-refresh";

/** Registers §6.5 six-hour (configurable) repeatable refresh when Redis is present. */
export async function ensureProviderMatchScoreRepeatable(connection: Redis): Promise<void> {
  const raw = process.env.SERVICEHUB_MATCH_SCORE_REPEAT_MS ?? `${6 * 3600 * 1000}`;
  const ms = Number(raw);
  if (!Number.isFinite(ms) || ms <= 0) {
    console.log(
      `[workers] SERVICEHUB_MATCH_SCORE_REPEAT_MS=${raw} — skipping repeatable provider match-score scheduler`,
    );
    return;
  }

  const queue = new Queue(QUEUE_PROVIDER_MATCH_SCORE, { connection });
  try {
    const existing = await queue.getRepeatableJobs();
    if (existing.some((j) => j.name === REPEATABLE_JOB_NAME)) return;

    await queue.add(
      REPEATABLE_JOB_NAME,
      { trigger: "scheduled_full_refresh" },
      {
        repeat: { every: ms },
        removeOnComplete: { count: 500 },
      },
    );
    console.log(`[workers] repeatable "${REPEATABLE_JOB_NAME}" registered every ${ms}ms`);
  } finally {
    await queue.close();
  }
}
