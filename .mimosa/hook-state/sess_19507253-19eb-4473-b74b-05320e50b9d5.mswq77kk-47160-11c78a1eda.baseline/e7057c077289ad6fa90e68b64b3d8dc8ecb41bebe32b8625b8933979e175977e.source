import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ??
  "postgresql://digihouse:digihouse@localhost:5432/digihouse";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
