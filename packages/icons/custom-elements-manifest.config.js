export default {
  globs: ['src/**/*.ts'],
  exclude: [
    'src/**/*.test.ts',
    'src/**/*.stories.ts',
    'src/**/*.d.ts',
    'src/vite-env.d.ts',
    'src/icons.ts',
  ],
  outdir: '.',
  litelement: false,
  fast: false,
  stencil: false,
  catalyst: false,
};
