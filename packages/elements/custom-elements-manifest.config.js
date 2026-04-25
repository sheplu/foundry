export default {
  globs: ['src/**/*.ts'],
  exclude: [
    'src/**/*.test.ts',
    'src/**/*.stories.ts',
    'src/**/*.d.ts',
    'src/core/**',
    'src/vite-env.d.ts',
  ],
  outdir: '.',
  litelement: false,
  fast: false,
  stencil: false,
  catalyst: false,
};
