import { defineProject } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineProject({
  resolve: {
    alias: {
      '@foundry/tokens': fileURLToPath(new URL('../tokens/src/index.ts', import.meta.url)),
    },
  },
  test: {
    name: '@foundry/themes',
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
  },
});
