import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const moduleName = process.argv[2];
const moduleArgs = process.argv.slice(3);

if (!moduleName) {
  console.error("Usage: node scripts/python-module.mjs <module> [...args]");
  process.exit(1);
}

const candidates = [];

if (process.env.LANDSHOPPERS_PYTHON) {
  candidates.push({ command: process.env.LANDSHOPPERS_PYTHON, args: [] });
}

const localAppData = process.env.LOCALAPPDATA;
const localAppDataCandidates = [
  localAppData,
  process.env.USERPROFILE
    ? join(process.env.USERPROFILE, "AppData", "Local")
    : undefined,
].filter(Boolean);

for (const localAppDataPath of localAppDataCandidates) {
  for (const version of ["Python313", "Python312", "Python311", "Python310"]) {
    const pythonPath = join(localAppDataPath, "Programs", "Python", version, "python.exe");
    if (existsSync(pythonPath)) {
      candidates.push({ command: pythonPath, args: [] });
    }
  }
}

candidates.push({ command: "python3", args: [] });
candidates.push({ command: "python", args: [] });
if (process.platform === "win32") {
  candidates.push({ command: "py", args: ["-3"] });
}

function canRunPython(candidate) {
  const result = spawnSync(candidate.command, [...candidate.args, "--version"], {
    encoding: "utf8",
    shell: false,
    stdio: "pipe",
  });

  return result.status === 0;
}

const candidate = candidates.find(canRunPython);

if (!candidate) {
  console.error(
    "No usable Python interpreter found. Install Python 3.12+ or set LANDSHOPPERS_PYTHON to python.exe.",
  );
  process.exit(1);
}

const result = spawnSync(
  candidate.command,
  [...candidate.args, "-m", moduleName, ...moduleArgs],
  {
    stdio: "inherit",
    shell: false,
  },
);

process.exit(result.status ?? 1);
