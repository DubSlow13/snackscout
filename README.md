# SnackScout

A mobile-first web app that helps shoppers find snacks and drinks, compare
community-reported prices and availability, and save favorite products.

## Project structure

```
snackscout/
├── client/       React frontend (Vite)
├── api/          Node.js backend (Express)
├── supabase/     Database migrations and seed files
└── docs/         Project documentation
```

## Prerequisites

- Node.js 18+ and npm

## Running locally

Start the API (port 3001):

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
