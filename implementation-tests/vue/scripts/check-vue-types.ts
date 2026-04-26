import { readFileSync } from 'node:fs';
import { loadTags, outPath, render } from './generate-vue-types.ts';

const expected = render(loadTags());
const actual = readFileSync(outPath, 'utf8');

if (actual !== expected) {
  process.stderr.write(
    `Vue types at ${outPath} are out of sync with the custom-elements.json manifests.\n`
    + 'Run `npm run generate:types -w @foundry/vue-canary` and commit the result.\n',
  );
  process.exit(1);
}
process.stdout.write('Vue types are in sync.\n');
