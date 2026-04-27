import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

interface Package {
  label: string;
  dir: string;
}

const PACKAGES: readonly Package[] = [
  { label: '@foundry/elements', dir: 'packages/elements' },
  { label: '@foundry/icons', dir: 'packages/icons' },
];

interface CemManifest {
  modules?: { path?: string }[];
}

/**
 * cem analyze emits the `modules` array in non-deterministic order across runs
 * (observed when adding a new component — two consecutive builds produced
 * different orderings). Normalize by sorting modules by path so semantic
 * equality isn't sensitive to that flake.
 */
function canonicalize(value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as CemManifest;
    if (Array.isArray(obj.modules)) {
      const sorted = [...obj.modules].sort((a, b) =>
        (a.path ?? '').localeCompare(b.path ?? ''),
      );
      return { ...value, modules: sorted };
    }
  }
  return value;
}

function sortedStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value), (_key, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const entries = Object.entries(val as Record<string, unknown>).sort(([a], [b]) =>
        a.localeCompare(b),
      );
      return Object.fromEntries(entries);
    }
    return val;
  });
}

function firstDivergence(
  a: unknown,
  b: unknown,
  path: readonly (string | number)[] = [],
): string | null {
  if (a === b) return null;
  if (
    a === null || b === null
    || typeof a !== 'object' || typeof b !== 'object'
  ) {
    return path.length === 0 ? '<root>' : path.join('.');
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i += 1) {
      const sub = firstDivergence(a[i], b[i], [...path, i]);
      if (sub) return sub;
    }
    return null;
  }
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const keys = Array.from(new Set([...Object.keys(aObj), ...Object.keys(bObj)])).sort();
  for (const key of keys) {
    const sub = firstDivergence(aObj[key], bObj[key], [...path, key]);
    if (sub) return sub;
  }
  return null;
}

let failed = false;

for (const pkg of PACKAGES) {
  process.stdout.write(`Checking ${pkg.label} custom-elements.json …\n`);
  const pkgDir = resolve(repoRoot, pkg.dir);
  const manifestPath = resolve(pkgDir, 'custom-elements.json');
  const pkgJsonPath = resolve(pkgDir, 'package.json');

  // Snapshot both files — the analyzer mutates them both as a side effect.
  const originalManifest = readFileSync(manifestPath, 'utf8');
  const originalPkgJson = readFileSync(pkgJsonPath, 'utf8');

  try {
    const result = spawnSync(
      'npx',
      ['cem', 'analyze', '--config', 'custom-elements-manifest.config.js'],
      { cwd: pkgDir, encoding: 'utf8' },
    );

    if (result.status !== 0) {
      process.stderr.write(
        `  ✗ cem analyze failed for ${pkg.label} (status ${result.status ?? 'null'})\n`
        + `${result.stderr}\n`,
      );
      failed = true;
      continue;
    }

    const generated: unknown = canonicalize(JSON.parse(readFileSync(manifestPath, 'utf8')));
    const committed: unknown = canonicalize(JSON.parse(originalManifest));

    if (sortedStringify(generated) === sortedStringify(committed)) {
      process.stdout.write('  ✓ in sync\n');
      continue;
    }

    failed = true;
    const where = firstDivergence(generated, committed) ?? '<unknown>';
    process.stderr.write(
      `  ✗ out of sync\n`
      + `      First divergence at: ${where}\n`,
    );
  } finally {
    // Restore both files unconditionally. The analyzer rewrites package.json's
    // `customElements` field and overwrites custom-elements.json itself — both
    // need to be returned to the committed state so repeat runs are idempotent.
    writeFileSync(manifestPath, originalManifest, 'utf8');
    writeFileSync(pkgJsonPath, originalPkgJson, 'utf8');
  }
}

if (failed) {
  process.stderr.write(
    '\ncustom-elements.json files must be regenerated before commit.\n'
    + '  npm run build -w @foundry/<package>\n'
    + 'then commit the updated custom-elements.json alongside your source changes.\n',
  );
  process.exit(1);
}

process.stdout.write('All custom-elements.json files are in sync with source.\n');
