# SnackScout

A mobile-first web app that helps shoppers find snacks and drinks, compare
community-reported prices and availability, and save favorite products.

## Project structure

```
snackscout/
├── client/       React frontend (Vite)
├── api/          Node.js backend (Express + Supabase)
├── db/           Database schema and seed scripts
├── supabase/     Database migrations and seed files
├── tests/        API smoke tests
└── docs/         Project documentation
```

## Prerequisites

- Node.js 18+ and npm
- A Supabase project initialized with `db/01_schema.sql` and `db/02_seed.sql`

## Running locally

The API needs Supabase credentials — copy `api/.env.example` to `api/.env`
and fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (see
[`api/README.md`](api/README.md) for details). Then start the API
(port 3001):

```sh
cd api
npm install
npm run dev
```

In a second terminal, start the client (port 5173):

```sh
cd client
npm install
npm run dev
```

The Vite dev server proxies `/api/*` requests to `http://localhost:3001`.
A health check is available at `http://localhost:3001/api/health`.

## Testing

With the API running:

```sh
BASE_URL=http://localhost:3001 ./tests/smoke.sh
```

API routes are documented in [`api/openapi.yaml`](api/openapi.yaml).
