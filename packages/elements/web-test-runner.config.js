import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  files: ['test/functional/**/*.spec.ts'],
  testFramework: {
    config: { ui: 'bdd', timeout: '5000' },
  },
  nodeResolve: true,
  browsers: [playwrightLauncher({ product: 'chromium' })],
  plugins: [esbuildPlugin({ ts: true, target: 'es2023' })],
  rootDir: '../..',
  testRunnerHtml: (testFramework) => `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <link rel="stylesheet" href="/packages/themes/dist/css/default.css" />
      </head>
      <body>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>
  `,
  coverageConfig: { exclude: ['**/node_modules/**', '**/test/**'] },
};
