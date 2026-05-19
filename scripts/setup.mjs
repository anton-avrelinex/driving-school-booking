#!/usr/bin/env node
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const ENV_PAIRS = [
  ["", "Root (docker-compose)"],
  ["apps/main-service", "Main service (pnpm dev / prisma)"],
  ["apps/observability-service", "Observability service (pnpm dev)"],
  ["apps/web-client", "Web client (Vite dev-proxy targets)"],
];

let created = 0;
let skipped = 0;
for (const [relDir, label] of ENV_PAIRS) {
  const dir = join(repoRoot, relDir);
  const example = join(dir, ".env.example");
  const target = join(dir, ".env");

  if (!existsSync(example)) {
    console.error(`! ${label}: missing ${example}`);
    process.exitCode = 1;
    continue;
  }
  if (existsSync(target)) {
    console.log(`= ${label}: .env already exists, skipped`);
    skipped++;
    continue;
  }
  copyFileSync(example, target);
  console.log(`+ ${label}: created .env from .env.example`);
  created++;
}

console.log(`\nDone (${created} created, ${skipped} skipped).`);
