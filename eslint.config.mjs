import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Explicit ignores disable ESLint's automatic `.gitignore` handling,
    // so keep gitignored generated dirs in sync with .gitignore here.
    "e2e/reports/**",
    "e2e/test-results/**",
    "node_modules/**",
    "temp/**",
    ".superpowers/**",
    "backups/**",
  ]),
]);

export default eslintConfig;
