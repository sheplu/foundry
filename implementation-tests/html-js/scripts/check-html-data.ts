import { readFileSync } from 'node:fs';
import { loadTags, outPath, render } from './generate-html-data.ts';

const expected = render(loadTags());
const actual = readFileSync(outPath, 'utf8');

if (actual !== expected) {
  process.stderr.write(
    `html custom data at ${outPath} is out of sync with the custom-elements.json manifests.\n`
    + 'Run `npm run generate:types -w @foundry/html-js-canary` and commit the result.\n',
  );
  process.exit(1);
}
process.stdout.write('html custom data is in sync.\n');
