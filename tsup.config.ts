import { defineConfig } from 'tsup';

export default defineConfig([
  // Library entry point
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'node20',
    shims: false,
    splitting: false,
    treeshake: true,
  },
  // CLI entry point
  {
    entry: {
      'cli/index': 'src/cli/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'node20',
    shims: false,
    splitting: false,
    treeshake: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
