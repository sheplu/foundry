import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: '@foundry/elements',
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'test/unit/**/*.test.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
});
