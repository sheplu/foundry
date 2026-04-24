import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: '@foundry/icons',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
