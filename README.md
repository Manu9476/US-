# Us+

Us+ is a private couple space built with React, Vite, Tailwind CSS, Framer Motion, and Supabase-ready cloud sync.

## Local Development

```bash
npm install
npm run dev
```

## Supabase Setup

The app works in local-only mode without Supabase. To make one shared account sync across devices:

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Add your project values:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Restart the dev server.

Photos upload to the `us-plus-photos` storage bucket and all couple data syncs through the `us_plus_workspaces` table.
