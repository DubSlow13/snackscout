# SnackScout Architecture

SnackScout is a mobile-first web app for finding snacks and drinks,
comparing community-reported prices and availability, and saving favorites.

## Components

- `client/` — React single-page app built with Vite. Dev server proxies
  `/api/*` requests to the backend.
- `api/` — Node.js + Express REST API serving the frontend and handling
  business logic.
- `supabase/` — Database layer: SQL migrations in `migrations/` and seed
  data in `seed.sql`, intended for a Supabase (Postgres) project.
