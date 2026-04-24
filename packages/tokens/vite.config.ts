import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    target: 'es2023',
    sourcemap: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [],
    },
  },
  plugins: [
    dts({
      entryRoot: 'src',
      include: ['src'],
      rollupTypes: true,
    }),
  ],
});
