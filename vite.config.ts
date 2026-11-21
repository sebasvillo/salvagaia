import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` → GitHub Pages. `npm run build:artifact` → un solo HTML para el artifact de Claude (scoreboard compartido).
export default defineConfig(({ mode }) => ({
  base: mode === 'artifact' ? './' : '/salvagaia/',
  plugins: mode === 'artifact' ? [viteSingleFile()] : [],
  build: mode === 'artifact' ? { outDir: 'dist-artifact' } : {},
  test: { include: ['src/**/__tests__/**/*.test.ts'], testTimeout: 120000 },
}) as any);
