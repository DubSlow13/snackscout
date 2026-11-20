# SnackScout API

Express backend for SnackScout. It talks to the project's Supabase
PostgreSQL database with the **service-role key**, which stays on the
server only — the React client always goes through this API and never
connects to Supabase directly.

## Install

```sh
cd api
npm install
```

## Environment variables

Copy `.env.example` to `.env` and fill in the real values:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | API port, defaults to `3001` |
| `SUPABASE_URL` | Yes | Project URL, e.g. `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service-role key from Supabase dashboard |

Find both in the Supabase dashboard under
**Project Settings → API** ("Project URL" and the `service_role` secret
key — not the anon key).

```sh
cp .env.example .env
# edit .env with the real values
```

`.env` is gitignored. **Never commit it** — the service-role key bypasses
row level security on every table.

## Run

```sh
npm run dev    # node --watch, reloads on file changes
npm start      # plain node
```

## Try the endpoints

```sh
# Health
curl http://localhost:3001/api/health

# All products / search / brand filter
curl 'http://localhost:3001/api/products'
curl 'http://localhost:3001/api/products?search=red'
curl 'http://localhost:3001/api/products?brand=Takis'

# One product
curl http://localhost:3001/api/products/<product_id>

# Stores, users, reports
curl http://localhost:3001/api/stores
curl http://localhost:3001/api/users
curl 'http://localhost:3001/api/reports?product_id=<product_id>'

# Submit a report (201 on success)
curl -X POST http://localhost:3001/api/reports \
  -H 'Content-Type: application/json' \
  -d '{
    "product_id": "<product_id>",
    "store_id": "<store_id>",
    "user_id": "<user_id>",
    "price": 3.19,
    "availability_status": "in_stock",
    "description": "Optional note"
  }'
```

Real UUIDs can be pulled from `GET /api/products`, `GET /api/stores`, and
`GET /api/users`, or from `db/02_seed.sql`.

## Automated smoke test

With the API running:

```sh
BASE_URL=http://localhost:3001 ./tests/smoke.sh
```

It exercises the main endpoints and exits nonzero on any failure.

## Notes

- `db/01_schema.sql` and `db/02_seed.sql` must have already been run in
  the Supabase SQL editor; the API reads those tables directly.
- If the env vars are missing the server still starts, but database
  routes return `503` and `/api/health` reports
  `"database": "not configured"`.
- Route documentation lives in `openapi.yaml` (OpenAPI 3.0).
