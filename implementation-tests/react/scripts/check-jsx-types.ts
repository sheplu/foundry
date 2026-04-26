import { readFileSync } from 'node:fs';
import { loadTags, outPath, render } from './generate-jsx-types.ts';

const expected = render(loadTags());
const actual = readFileSync(outPath, 'utf8');

if (actual !== expected) {
  process.stderr.write(
    `JSX types at ${outPath} are out of sync with the custom-elements.json manifests.\n`
    + 'Run `npm run generate:types -w @foundry/react-canary` and commit the result.\n',
  );
  process.exit(1);
}
process.stdout.write('JSX types are in sync.\n');
