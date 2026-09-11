import { defineConfig } from 'drizzle-kit';

// Schema discovery only. No credentials, push/migrate scripts or baseline journal
// are configured until the first persistence slice is reviewed.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/modules/*/infrastructure/*.schema.ts',
  out: './drizzle',
  strict: true,
  verbose: false,
});
