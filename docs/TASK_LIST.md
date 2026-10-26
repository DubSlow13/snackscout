# SnackScout — Development Task List

| | |
|---|---|
| **Source of truth** | `docs/PRD.md` (Level 1 Specification, nine approved user stories) |
| **Status** | Draft — Prototype 1 (scaffolding) complete; all feature tasks pending |
| **Date** | 2026-10-26 |

## Suggested implementation order

1. **Find Products** — catalog and search come first; every later feature
   needs products and stores to exist.
2. **Report Products** — comparison and verification have no data until
   reports can be submitted.
3. **Compare Products** — consumes report data produced by area 2.
4. **Save Products** — independent of 3, but relies on products from 1.
5. **Verify Reports** — last; requires reports (2) and depends on an
   unresolved identity-verification decision.

Priorities: **P1** = foundational, **P2** = core feature, **P3** = dependent
or blocked feature.

---

## Prototype 1 — Scaffolding (baseline)

Work that establishes the project foundation. Kept separate from feature
development.

### Completed

| Task | Description | Status |
|------|-------------|--------|
| SCAFFOLD-1 | Repository structure: `client/`, `api/`, `supabase/`, `docs/`, `README.md`, `.gitignore` | Done |
| SCAFFOLD-2 | Vite + React client, minimal runnable app | Done |
| SCAFFOLD-3 | Express API with `GET /api/health` | Done |
| SCAFFOLD-4 | Vite dev proxy forwarding `/api/*` to `localhost:3001` | Done |
| SCAFFOLD-5 | Node.js LTS (v24.22.1) + npm via nvm; dependencies installed; both servers verified running | Done |
| SCAFFOLD-6 | Documentation: `README.md`, `docs/architecture.md`, `docs/PRD.md`, this task list | Done |

### Future development (all pending)

- All tasks in the five feature areas below.
- Supabase project provisioning and real schema migrations.
- Authentication / user accounts (required by several features; account
  model is a pending decision — see "Pending decisions").
- Deployment and GitHub publishing.

---

## Feature area: Find Products (US-1, US-2)

### FIND-1 — Product and store catalog data model + seed data
- **User story:** US-1
- **Priority:** P1 (first task overall)
- **Depends on:** None
- **Description:** Define the `products` and `stores` tables (Supabase
  migrations) and create seed rows so search has data to return. Include
  fields needed later: product name, brand, category; store name and
  location.
- **Acceptance criteria:**
  - Migrations run cleanly on a fresh database.
  - Seed file loads a documented minimum set of products and stores
    covering multiple brands.
  - Every product has a brand; every store has a name and location.

### FIND-2 — Product search API endpoint
- **User story:** US-1
- **Priority:** P1
- **Depends on:** FIND-1
- **Description:** `GET /api/products?search=<term>` returns products whose
  name matches the search term (case-insensitive, partial match).
- **Acceptance criteria:**
  - `?search=cola` returns all products with "cola" in the name.
  - Empty or no-match searches return `200` with an empty array, not an
    error.
  - Response includes product id, name, and brand.

### FIND-3 — Product search UI
- **User story:** US-1
- **Priority:** P1
- **Depends on:** FIND-2
- **Description:** Mobile-first search screen: a search input plus a results
  list of matching products.
- **Acceptance criteria:**
  - Typing a product name displays matching results without a page reload.
  - A no-match search shows a clear "no results" state.
  - Layout is usable at a 375px-wide viewport.

### FIND-4 — Brand list endpoint + brand filter parameter
- **User story:** US-2
- **Priority:** P2
- **Depends on:** FIND-2
- **Description:** `GET /api/brands` returns the distinct brands in the
  catalog; `GET /api/products?brand=<brand>` (combinable with `search`)
  filters results by brand.
- **Acceptance criteria:**
  - `/api/brands` returns each brand exactly once.
  - `?brand=X` returns only products of brand X.
  - `brand` and `search` parameters work together.

### FIND-5 — Brand dropdown filter UI
- **User story:** US-2
- **Priority:** P2
- **Depends on:** FIND-3, FIND-4
- **Description:** Dropdown on the search screen populated from
  `/api/brands`; selecting a brand narrows the displayed results.
- **Acceptance criteria:**
  - Dropdown lists all brands returned by the API.
  - Selecting a brand immediately narrows current results.
  - Clearing the filter restores unfiltered results.

---

## Feature area: Report Products (US-7)

### RPT-1 — Reports data model
- **User story:** US-7
- **Priority:** P1
- **Depends on:** FIND-1
- **Description:** Migration for a `reports` table linking a product and
  store with a submitted price, availability status, timestamp, and
  reporter. Report expiration/freshness rules are a **pending decision**
  (see below) — the model must store timestamps so rules can be applied
  later.
- **Acceptance criteria:**
  - Migration runs cleanly; table enforces that a report references a real
    product and store.
  - Each row stores price, availability status, and submission timestamp.

### RPT-2 — Submit report API endpoint
- **User story:** US-7
- **Priority:** P1
- **Depends on:** RPT-1
- **Description:** `POST /api/reports` accepts `{ product_id, store_id,
  price, availability }` and creates a report. Validates input.
- **Acceptance criteria:**
  - Valid submission returns `201` and the created report.
  - Missing/invalid fields return `400` with a useful error.
  - Reporter type (shopper vs. employee) can be recorded once accounts
    exist.

### RPT-3 — Report submission UI
- **User story:** US-7
- **Priority:** P2
- **Depends on:** RPT-2, FIND-3
- **Description:** Mobile-first form letting a user pick a product and
  store, enter a price, and mark availability (e.g., in stock / out of
  stock).
- **Acceptance criteria:**
  - Form submits through the API and confirms success to the user.
  - Invalid input is rejected client-side before submission.
  - Usable at a 375px viewport.

---

## Feature area: Compare Products (US-13, US-14, US-15)

### CMP-1 — Price/availability comparison API endpoint
- **User story:** US-13
- **Priority:** P2
- **Depends on:** RPT-1
- **Description:** `GET /api/products/:id/stores` returns, per store, the
  latest reported price and availability for that product. How "latest" is
  chosen when reports conflict is a **pending decision**.
- **Acceptance criteria:**
  - Response lists every store with at least one report for the product.
  - Each entry includes store name, price, availability, and report
    timestamp.
  - Product with no reports returns `200` with an empty array.

### CMP-2 — Store price list UI
- **User story:** US-13
- **Priority:** P2
- **Depends on:** CMP-1, FIND-3
- **Description:** Product detail view listing each store with its reported
  price and availability.
- **Acceptance criteria:**
  - Selecting a product from search opens its store list.
  - Each store row shows price, availability status, and report age.
  - Empty state shown when no reports exist.

### CMP-3 — Sort prices lowest to highest
- **User story:** US-14
- **Priority:** P2
- **Depends on:** CMP-2
- **Description:** Sort the store list ascending by reported price (API
  ordering parameter or client-side sort).
- **Acceptance criteria:**
  - Default or selectable ordering lists cheapest store first.
  - Ordering is stable and correct for equal prices.
  - Stores with no price report do not break the sort.

### CMP-4 — Availability display with report age
- **User story:** US-15
- **Priority:** P2
- **Depends on:** CMP-2
- **Description:** Show reported availability per store (e.g., in stock /
  out of stock / unreported) alongside how old the report is. Whether
  reports expire or decay visually is a **pending decision** — display age
  regardless so shoppers can judge freshness themselves.
- **Acceptance criteria:**
  - Every store row shows an availability status or "unreported."
  - Report age is visible (e.g., "reported 2 days ago").

---

## Feature area: Save Products (US-19, US-22)

### SAVE-1 — Favorites persistence model
- **User story:** US-19
- **Priority:** P3
- **Depends on:** FIND-1
- **Description:** Storage for saved products per user. Whether accounts
  are required (vs. anonymous/local storage) is a **pending decision** —
  design so either can plug in.
- **Acceptance criteria:**
  - A saved favorite survives a page reload.
  - Duplicate saves of the same product are prevented.

### SAVE-2 — Favorites API endpoints
- **User story:** US-19
- **Priority:** P3
- **Depends on:** SAVE-1
- **Description:** `POST /api/favorites`, `GET /api/favorites`,
  `DELETE /api/favorites/:id` for saving, listing, and removing favorites.
- **Acceptance criteria:**
  - Saved products can be listed and removed via the API.
  - Removing a favorite returns success and is reflected on re-list.

### SAVE-3 — Favorites UI
- **User story:** US-19
- **Priority:** P3
- **Depends on:** SAVE-2, CMP-2
- **Description:** "Save" affordance on product detail plus a favorites
  screen listing saved products with links back to their detail views.
- **Acceptance criteria:**
  - User can save and un-save a product.
  - Favorites screen lists all saved products and navigates to each.

### SAVE-4 — Restock alert toggle on favorites
- **User story:** US-22
- **Priority:** P3
- **Depends on:** SAVE-3
- **Description:** Let users enable/disable a restock alert per saved
  product; persist the preference. What actually delivers the alert is a
  **pending decision** — this task covers only the opt-in state.
- **Acceptance criteria:**
  - Alert preference can be toggled per favorite and persists.
  - UI clearly shows which favorites have alerts enabled.

### SAVE-5 — Restock alert delivery — BLOCKED
- **User story:** US-22
- **Priority:** P3 — **blocked pending Analyst decision**
- **Depends on:** SAVE-4, plus decisions on delivery channel and trigger
- **Description:** Deliver an alert when a saved product is reported back
  in stock. Channel (push/email/SMS/in-app) and trigger (new report vs.
  employee verification) are undecided — do not build until clarified.
- **Acceptance criteria:** To be defined once the Analyst resolves
  channel, trigger, and opt-out rules.

---

## Feature area: Verify Reports (US-25)

### VER-1 — Employee identity/role model — BLOCKED
- **User story:** US-25
- **Priority:** P3 — **blocked pending Analyst decision**
- **Depends on:** Pending decision on how employment is proven
- **Description:** Model for marking an account as a store employee tied to
  a specific store. The verification mechanism (invite code, employer
  email, manual approval, etc.) is undecided — schema should not commit to
  one yet.
- **Acceptance criteria:** To be defined once the Analyst resolves the
  identity mechanism.

### VER-2 — Report verification API endpoint
- **User story:** US-25
- **Priority:** P3
- **Depends on:** RPT-1, VER-1
- **Description:** Endpoint for an employee to mark an availability report
  at their store as verified. Whether employee-submitted reports are
  auto-verified is a **pending decision**.
- **Acceptance criteria:**
  - Only employee accounts can verify.
  - A report can carry a verified flag plus verifier and timestamp.
  - Non-employee requests are rejected.

### VER-3 — Verification UI + verified indicator
- **User story:** US-25
- **Priority:** P3
- **Depends on:** VER-2, CMP-4
- **Description:** Employee-facing action to verify a report, and a
  shopper-facing indicator showing which reports are employee-verified.
- **Acceptance criteria:**
  - Employees see a verify action on reports for their store only.
  - Verified reports are visually distinguished for shoppers.

---

## Pending decisions (do not build around these)

These must be resolved by the Analyst/client before the flagged tasks can
be completed. Tracked here so no task silently assumes an answer.

| Decision | Affected tasks | Question for Analyst |
|----------|----------------|----------------------|
| Alert delivery channel & trigger | SAVE-5 | Push, email, SMS, or in-app? Triggered by a new report or by employee verification? Opt-out rules? |
| Report freshness/expiration | RPT-1, CMP-1, CMP-4 | Do reports expire or decay? How are conflicting same-store reports reconciled? |
| Employee identity verification | VER-1, VER-2 | How is employment proven? Are employee-submitted reports auto-verified? |
| Account requirement for favorites | SAVE-1–SAVE-4 | Are accounts required, or is anonymous/local storage acceptable for v1? |
| Catalog provenance | FIND-1 | Curated seed data only, or can users add new products/stores? |
