import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

const repoRoot = process.cwd();
const outputDir = path.join(repoRoot, ".lighthouse");
const outputPath = path.join(outputDir, "report.json");
const chromePath =
  process.env.LIGHTHOUSE_CHROME_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

await mkdir(outputDir, { recursive: true });

const cliPath = path.join(
  repoRoot,
  "node_modules",
  "lighthouse",
  "cli",
  "index.js"
);

const args = [
  cliPath,
  "http://127.0.0.1:4173",
  "--preset=desktop",
  "--only-categories=performance,accessibility,best-practices,seo",
  `--chrome-path=${chromePath}`,
  "--chrome-flags=--headless=new --no-sandbox",
  "--quiet",
  "--output=json",
  `--output-path=${outputPath}`,
];

await execFileAsync(process.execPath, args, { cwd: repoRoot });

process.stdout.write(`Lighthouse report saved to ${outputPath}\n`);
