import { defineConfig } from 'drizzle-kit';

// Generate reviewed module-owned schemas; migration execution is an explicit script.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/modules/*/infrastructure/*.schema.ts',
  out: './drizzle',
  strict: true,
  verbose: false,
});
