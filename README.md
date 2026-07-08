# ShelfPOS Admin Dashboard

Online admin panel (TanStack Start + Supabase). Read-only mirror of both stores.

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with Supabase URL + anon key
npm run dev
```

## Env vars (Vercel)

| Variable                 | Description              |
| ------------------------ | ------------------------ |
| `VITE_SUPABASE_URL`      | Supabase project URL     |
| `VITE_SUPABASE_ANON_KEY` | Anon key (RLS read-only) |

Create an admin user in Supabase Auth (see `SUPA.sql`).

## Deploy (Vercel)

1. Import the `DASHBOARD` folder as a new Vercel project
2. Set root directory to `DASHBOARD`
3. Add env vars above
4. Deploy — build command: `npm run build`

## Features

- **Store switcher** — Tienda A / B with online/offline status (last sync activity)
- **Panel** — KPIs, sales trend, payments, top products, inventory
- **Reportes** — today / week / month summaries
- **Cierres** — read-only cierre history with discrepancy highlighting
- **Auditoría** — synced audit log

Excluded vs Electron admin: productos, usuarios, settings, print queue, export/backup.
