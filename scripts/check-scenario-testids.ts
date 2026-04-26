import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

interface Source {
  label: string;
  path: string;
}

const SCENARIO: Source = {
  label: 'scenario.md',
  path: resolve(repoRoot, 'implementation-tests/scenario.md'),
};

const CANARIES: readonly Source[] = [
  {
    label: '@foundry/react-canary',
    path: resolve(repoRoot, 'implementation-tests/react/src/App.tsx'),
  },
  {
    label: '@foundry/vue-canary',
    path: resolve(repoRoot, 'implementation-tests/vue/src/App.vue'),
  },
  {
    label: '@foundry/html-js-canary',
    path: resolve(repoRoot, 'implementation-tests/html-js/index.html'),
  },
];

const TESTID_RE = /data-testid\s*=\s*"([^"]+)"/g;

function extractTestIds(source: Source): Set<string> {
  const raw = readFileSync(source.path, 'utf8');
  const ids = new Set<string>();
  for (const match of raw.matchAll(TESTID_RE)) {
    const id = match[1];
    if (id !== undefined) ids.add(id);
  }
  return ids;
}

function diff(expected: Set<string>, actual: Set<string>): { missing: string[]; extra: string[] } {
  const missing = [...expected].filter((id) => !actual.has(id)).sort();
  const extra = [...actual].filter((id) => !expected.has(id)).sort();
  return { missing, extra };
}

const scenarioIds = extractTestIds(SCENARIO);
if (scenarioIds.size === 0) {
  process.stderr.write(`No data-testid values found in ${SCENARIO.path}. Aborting.\n`);
  process.exit(2);
}

let failed = false;

process.stdout.write(
  `Scenario declares ${scenarioIds.size} data-testid values in ${SCENARIO.label}.\n`,
);

for (const canary of CANARIES) {
  const actual = extractTestIds(canary);
  const { missing, extra } = diff(scenarioIds, actual);

  if (missing.length === 0 && extra.length === 0) {
    process.stdout.write(`  ✓ ${canary.label} — ${actual.size} ids, all match.\n`);
    continue;
  }

  failed = true;
  process.stderr.write(`  ✗ ${canary.label} (${canary.path})\n`);
  if (missing.length > 0) {
    process.stderr.write(`      missing: ${missing.join(', ')}\n`);
  }
  if (extra.length > 0) {
    process.stderr.write(`      extra:   ${extra.join(', ')}\n`);
  }
}

if (failed) {
  process.stderr.write(
    '\nscenario.md and the canary implementations must declare the same data-testid set.\n'
    + 'Update the mismatching canaries (or scenario.md) and commit.\n',
  );
  process.exit(1);
}

process.stdout.write('All canaries are in sync with scenario.md.\n');
