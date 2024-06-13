/// <reference types="vitest" />
import {defineConfig} from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths';
export default defineConfig({
  plugins: [
    tsconfigPaths()
  ],
  resolve: {
  },
  test: {
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
      reporter: ["json", "lcov"]
    }
  }
});
