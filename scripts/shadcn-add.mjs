#!/usr/bin/env node
// Wraps `shadcn add` so generated components import `cn` from the project's
// documented path (`@/utils/cn`) instead of the bare `cn` package the CLI
// emits. AGENTS.md keeps shared helpers under src/utils, and the CLI has no
// setting for this, so the rewrite happens here rather than by hand on every
// component that gets added.

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const UI_DIR = path.resolve(import.meta.dirname, '../src/components/ui/shadcn');
const BARE_CN_IMPORT = /from ['"]cn['"]/g;

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run ui:add -- <component> [...components]');
  process.exit(1);
}

const cli = spawnSync('npx', ['--yes', 'shadcn@latest', 'add', ...args], {
  stdio: 'inherit',
});
if (cli.status !== 0) {
  process.exit(cli.status ?? 1);
}

const rewritten = readdirSync(UI_DIR)
  .filter((file) => file.endsWith('.tsx'))
  .filter((file) => {
    const filePath = path.join(UI_DIR, file);
    const source = readFileSync(filePath, 'utf8');
    const next = source.replace(BARE_CN_IMPORT, "from '@/utils/cn'");
    if (next === source) return false;
    writeFileSync(filePath, next);
    return true;
  });

if (rewritten.length > 0) {
  console.log(`Rewrote the cn import in: ${rewritten.join(', ')}`);
}
