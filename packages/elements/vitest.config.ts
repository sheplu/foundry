import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: '@foundry/elements',
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/unit/**/*.test.ts'],
  },
});
