import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: '@foundry/tokens',
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
  },
});
