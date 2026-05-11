import { delimiter, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/with-pythonpath.mjs <command> [...args]");
  process.exit(1);
}

const packagePath = resolve(".python-packages");
const existingPythonPath = process.env.PYTHONPATH;

const result = spawnSync(command, args, {
  stdio: "inherit",
  shell: false,
  env: {
    ...process.env,
    PYTHONPATH: existingPythonPath
      ? `${packagePath}${delimiter}${existingPythonPath}`
      : packagePath,
  },
});

process.exit(result.status ?? 1);
