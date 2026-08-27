#!/usr/bin/env node
// Fails the build if the *changed lines* in this PR (vs. the base branch) fall
// below THRESHOLD % coverage, using the lcov report from `npm run test:coverage`.
// This mirrors "coverage on new code" gates (e.g. SonarQube) without any
// external service: only lines actually added/modified in the diff are
// counted, cross-referenced against per-line hit counts from lcov.info.

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const THRESHOLD = 80;
const LCOV_PATH = 'coverage/lcov.info';
const CHANGED_FILE_PATTERN = /^src\/.*\.(ts|tsx)$/;
const EXCLUDE_PATTERN = /(^|\/)src\/tests\/|\.d\.ts$|(^|\/)src\/main\.tsx$/;

function resolveBaseRef() {
  const base = process.env.GITHUB_BASE_REF || 'main';
  for (const ref of [`origin/${base}`, base]) {
    try {
      execFileSync('git', ['rev-parse', '--verify', ref], { stdio: 'ignore' });
      return ref;
    } catch {
      // try next candidate
    }
  }
  throw new Error(
    `Could not resolve base ref "${base}" (tried origin/${base} and ${base}). ` +
      'Make sure the base branch is fetched (fetch-depth: 0 in checkout).'
  );
}

function getChangedLines(baseRef) {
  const diff = execFileSync(
    'git',
    ['diff', '--unified=0', `${baseRef}...HEAD`],
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 32 }
  );

  const changed = new Map(); // file -> Set<line numbers added/modified>
  let currentFile = null;
  let newLine = null;

  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) {
      const path = line.slice(4).trim();
      currentFile = path === '/dev/null' ? null : path.replace(/^b\//, '');
      continue;
    }
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      newLine = match ? parseInt(match[1], 10) : null;
      continue;
    }
    if (currentFile === null || newLine === null) continue;

    if (line.startsWith('+') && !line.startsWith('+++')) {
      if (!changed.has(currentFile)) changed.set(currentFile, new Set());
      changed.get(currentFile).add(newLine);
      newLine++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      // removed line: doesn't exist in the new file, don't advance newLine
    }
  }

  for (const file of [...changed.keys()]) {
    if (!CHANGED_FILE_PATTERN.test(file) || EXCLUDE_PATTERN.test(file)) {
      changed.delete(file);
    }
  }

  return changed;
}

function parseLcov(path) {
  const hits = new Map(); // file -> Map<line, hitCount>
  const text = readFileSync(path, 'utf8');
  let currentFile = null;

  for (const line of text.split('\n')) {
    if (line.startsWith('SF:')) {
      currentFile = line.slice(3).trim();
      if (!hits.has(currentFile)) hits.set(currentFile, new Map());
    } else if (line.startsWith('DA:') && currentFile) {
      const [lineNoStr, hitStr] = line.slice(3).split(',');
      hits.get(currentFile).set(parseInt(lineNoStr, 10), parseInt(hitStr, 10));
    } else if (line.startsWith('end_of_record')) {
      currentFile = null;
    }
  }

  return hits;
}

function main() {
  if (!existsSync(LCOV_PATH)) {
    console.error(
      `✖ ${LCOV_PATH} not found. Run "npm run test:coverage" before this script.`
    );
    process.exit(1);
  }

  const baseRef = resolveBaseRef();
  const changedLines = getChangedLines(baseRef);
  const lcov = parseLcov(LCOV_PATH);

  if (changedLines.size === 0) {
    console.log(
      'No changed .ts/.tsx source lines in this diff — nothing to gate.'
    );
    return;
  }

  let totalExecutable = 0;
  let totalCovered = 0;
  const rows = [];

  for (const [file, lines] of changedLines) {
    const fileHits = lcov.get(file);
    let fileExecutable = 0;
    let fileCovered = 0;

    for (const lineNo of lines) {
      if (!fileHits || !fileHits.has(lineNo)) continue; // not an executable line
      fileExecutable++;
      totalExecutable++;
      if (fileHits.get(lineNo) > 0) {
        fileCovered++;
        totalCovered++;
      }
    }

    if (fileExecutable > 0) {
      const pct = (fileCovered / fileExecutable) * 100;
      rows.push({
        file,
        covered: fileCovered,
        executable: fileExecutable,
        pct,
      });
    }
  }

  rows.sort((a, b) => a.pct - b.pct);

  const summaryLines = ['| File | Changed-line coverage |', '| --- | --- |'];
  for (const r of rows) {
    summaryLines.push(
      `| \`${r.file}\` | ${r.covered}/${r.executable} (${r.pct.toFixed(1)}%) |`
    );
  }

  console.log(
    rows
      .map(
        (r) => `${r.pct.toFixed(1)}%\t${r.covered}/${r.executable}\t${r.file}`
      )
      .join('\n')
  );

  if (totalExecutable === 0) {
    console.log(
      'No executable lines among the changed lines — nothing to gate.'
    );
    return;
  }

  const overallPct = (totalCovered / totalExecutable) * 100;
  const header = `Changed-code coverage: ${totalCovered}/${totalExecutable} lines (${overallPct.toFixed(1)}%), threshold ${THRESHOLD}%`;
  console.log('\n' + header);

  if (process.env.GITHUB_STEP_SUMMARY) {
    const status = overallPct >= THRESHOLD ? '✅ PASSED' : '❌ FAILED';
    const md = [
      `### Changed-files coverage gate — ${status}`,
      '',
      header,
      '',
      ...summaryLines,
      '',
    ].join('\n');
    execFileSync('sh', ['-c', `cat >> "$GITHUB_STEP_SUMMARY"`], { input: md });
  }

  if (overallPct < THRESHOLD) {
    console.error(
      `\n✖ Changed-code coverage ${overallPct.toFixed(1)}% is below the ${THRESHOLD}% threshold.`
    );
    process.exit(1);
  }

  console.log(`\n✓ Changed-code coverage meets the ${THRESHOLD}% threshold.`);
}

main();
