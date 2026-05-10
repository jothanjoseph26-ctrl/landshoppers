/**
 * Repeatable DB smoke: docker compose up → wait for PostGIS → migrate → seed → PostGIS verify.
 * Requires Docker Desktop running. From repo root: `pnpm run db:smoke`
 */
import { execSync } from "node:child_process";
import net from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Prefer `pnpm` on PATH; fall back to `npx pnpm` (Windows / minimal installs). */
function pnpmBin() {
  try {
    execSync("pnpm --version", { stdio: "pipe", shell: true });
    return "pnpm";
  } catch {
    return "npx --yes pnpm@9.15.9";
  }
}
const PG_PORT = 55432;
const PG_HOST = "127.0.0.1";
const CONNECT_TIMEOUT_MS = 90_000;
const RETRY_MS = 500;

function waitForPort(port, host = PG_HOST) {
  return new Promise((resolvePromise, reject) => {
    const started = Date.now();
    const attempt = () => {
      const socket = net.createConnection({ port, host }, () => {
        socket.end();
        resolvePromise();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - started > CONNECT_TIMEOUT_MS) {
          reject(
            new Error(
              `db-smoke: timeout after ${CONNECT_TIMEOUT_MS}ms waiting for PostgreSQL at ${host}:${port}`,
            ),
          );
        } else {
          setTimeout(attempt, RETRY_MS);
        }
      });
    };
    attempt();
  });
}

function run(label, cmd) {
  console.log(`db-smoke: ${label}`);
  execSync(cmd, { cwd: root, stdio: "inherit", shell: true });
}

async function main() {
  const pnpm = pnpmBin();
  run("docker compose up -d", "docker compose up -d");
  console.log(`db-smoke: waiting for TCP ${PG_HOST}:${PG_PORT} (PostGIS container)...`);
  await waitForPort(PG_PORT);
  run("db:migrate", `${pnpm} run db:migrate`);
  run("db:seed", `${pnpm} run db:seed`);
  run("db:verify:postgis", `${pnpm} run db:verify:postgis`);
  console.log("db-smoke: OK (docker up, migrate, seed, verify:postgis)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
