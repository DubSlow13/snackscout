# SnackScout — Product Requirements Document

| | |
|---|---|
| **Project** | SnackScout |
| **Status** | Draft — based on Analyst's Level 1 Specification |
| **Date** | 2026-10-26 |
| **Current phase** | Prototype 1: Scaffolding |

## 1. Project Overview and Goals

SnackScout is a mobile-first web application that helps shoppers find snacks
and drinks at nearby stores, compare community-reported prices and stock
availability, and save favorite products.

Prices and availability on SnackScout are **community-reported**, not pulled
from store systems. The product's value comes from crowdsourced data —
contributed by shoppers and store employees alike — plus a verification
layer provided by participating store employees.

### Goals

- Help shoppers quickly locate specific snacks and drinks near them.
- Give shoppers a way to compare prices across stores before they travel.
- Surface product availability so shoppers avoid wasted trips.
- Let shoppers save products and be alerted when they are restocked.
- Build trust in community data through employee verification of reports.

## 2. Target Users

### Shoppers (primary)

People looking for specific snacks or drinks who want to find them nearby,
pay the best price, and confirm items are in stock before visiting a store.

### Store employees (secondary)

Employees at participating stores. Like shoppers, they can submit product
price and availability reports; in addition, they can verify existing
availability reports for their location, adding a trust signal on top of
community data.

## 3. Functional Requirements (Approved)

The following nine requirements correspond to approved user stories 1, 2, 7,
13, 14, 15, 19, 22, and 25 from the Level 1 Specification.

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-1 (US-1) | Product search | Search for snacks and drinks by product name. |
| FR-2 (US-2) | Brand filter | Select a brand from a dropdown to narrow searches. |
| FR-3 (US-7) | Report price & availability | Submit a product's price and availability at a specific store. |
| FR-4 (US-13) | Price comparison | Compare prices for a product across different stores. |
| FR-5 (US-14) | Sort by price | Sort store prices for a product from lowest to highest. |
| FR-6 (US-15) | View availability | View reported product availability at different stores. |
| FR-7 (US-19) | Favorites | Save favorite products for later access. |
| FR-8 (US-22) | Restock alerts | Enable restock alerts for saved products. |
| FR-9 (US-25) | Employee verification | Allow store employees to verify reported product availability. |

Note: store employees may also submit price and availability reports like
other community members (US-7); verification (US-25) is their additional
capability.

## 4. Technical Architecture

SnackScout is a three-tier web application:

- **Frontend — `client/`**: React single-page application built with Vite.
  Mobile-first UI. The Vite dev server proxies `/api/*` requests to the
  backend during development.
- **Backend — `api/`**: Node.js REST API using Express. Serves the frontend,
  applies business logic, and mediates all database access.
- **Database — `supabase/` (planned)**: Supabase-hosted PostgreSQL. SQL
  migrations live in `supabase/migrations/` and seed data in
  `supabase/seed.sql`. Not yet provisioned.

Current state: the repository is scaffolded and both the client and API run
locally and communicate through the dev proxy.

## 5. Constraints and Exclusions

### Exclusions (confirmed out of scope)

- **No online purchasing** — SnackScout does not sell products.
- **No delivery or pickup** — no fulfillment features of any kind.
- **No direct store inventory integration** — all price and availability
  data is reported by shoppers or store employees (and may be
  employee-verified), never pulled from store POS/inventory systems.

### Constraints

- Mobile-first design; desktop layouts are secondary.
- All price and availability data is user-generated and therefore
  approximate — the UI must not present it as authoritative store data.
- Prototype 1 covers scaffolding only (see Section 7).

## 6. Outstanding Questions for the Analyst/Client

The following decisions are unresolved and must be answered by the
Analyst/client before the corresponding features are built. No assumptions
have been made.

### Employee verification (FR-9 / US-25)

- How does a store employee prove they work at a store — invite codes,
  employer email domain, manual approval, or another mechanism?
- What does "verify" mean concretely — confirming a report is accurate,
  overriding the reported value, or flagging it as wrong?
- Can an employee un-verify or dispute a report later?
- When an employee submits an availability report, is it automatically
  treated as verified, or does it require verification like a shopper
  report?
- How is verification shown to shoppers (badge, label, separate status)?

### Report freshness (FR-3, FR-6 / US-7, US-15)

- How long is a price/availability report considered current — is there an
  expiration or decay policy?
- How should report age be displayed (e.g., "reported 2 days ago")?
- How are conflicting reports from different shoppers at the same store
  reconciled — most recent wins, majority, or all shown?

### Restock alerts (FR-8 / US-22)

- What channel delivers alerts — push notification, email, SMS, or in-app
  only?
- What triggers an alert — a new "in stock" report, an employee
  verification, or both?
- Are there limits on alerts per user, and how does a shopper opt out?

### Additional open items

- Is an account required to save favorites and receive alerts, or is
  anonymous/local storage acceptable for the first release?
- How do products and stores enter the catalog — curated seed data only, or
  can shoppers add new products/stores?
- Is there any moderation process for abusive or fraudulent reports?

## 7. Scope of Prototype 1 (Scaffolding)

Prototype 1 establishes the project foundation only.

### In scope for Prototype 1

- Repository structure: `client/` (React + Vite), `api/` (Express),
  `supabase/`, `docs/`.
- Both client and API install and run locally; the API exposes a health
  check and the Vite dev proxy reaches it.
- Documentation: `README.md`, `docs/architecture.md`, this PRD.

### Out of scope for Prototype 1

- All nine functional requirements (no search, reporting, comparison,
  favorites, alerts, or verification UI or logic).
- Database schema, migrations content, and Supabase provisioning.
- Authentication and user accounts.
- Any application features or GitHub publishing.
