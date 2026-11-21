import { defineConfig } from 'vite';
export default defineConfig({
  base: '/salvagaia/',
  test: { include: ['src/**/__tests__/**/*.test.ts'], testTimeout: 120000 },
} as any);
