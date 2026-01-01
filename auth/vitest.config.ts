import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'src/tests/',
        'dist/',
        'src/index.ts', // Exclude entry point
      ],
    },
  },
});
