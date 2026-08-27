# Local Supabase

Install the Supabase CLI, then run `supabase start` from this directory. Copy the reported API URL, anon key, service role key, and database URL into the root `.env`.

Apply versioned schema changes with `pnpm db:migrate`. The API uses service credentials only on the server; the web only receives the publishable key.
