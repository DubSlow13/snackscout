# SnackScout — Workspace Rules

Coding and collaboration standards for the SnackScout dev team. These rules
apply to the whole repository (`client/`, `api/`, `supabase/`, `docs/`).

Keep them lightweight — we're a small college team. When in doubt, ask a
teammate before doing something unconventional.

## 1. Naming conventions

### Files

| Type | Convention | Example |
|------|-----------|---------|
| React components | PascalCase `.jsx` | `ProductCard.jsx`, `SearchBar.jsx` |
| Non-component JS (hooks, utils, API helpers) | camelCase `.js` | `useFavorites.js`, `apiClient.js` |
| Express route/controller files | camelCase `.js` | `products.js`, `reports.js` |
| Database migrations | timestamp + snake_case | `20261101000000_create_products.sql` |
| Documentation | SCREAMING_SNAKE for top-level docs, otherwise descriptive | `PRD.md`, `TASK_LIST.md` |

### JavaScript

- **Variables:** `camelCase` — `productList`, `selectedStore`
- **Constants (true constants):** `UPPER_SNAKE_CASE` — `API_BASE_URL`
- **Functions:** `camelCase`, verb-first — `fetchProducts()`, `sortByPrice()`
- **React components:** `PascalCase` — `StorePriceList`
- **Event handlers:** `handle` prefix — `handleSearchSubmit`
- **Booleans:** `is`/`has`/`can` prefix — `isVerified`, `hasReports`
- **API endpoints:** lowercase plural nouns — `/api/products`,
  `/api/reports`, `/api/favorites`

### Database (Supabase/PostgreSQL)

- **Tables:** plural `snake_case` — `products`, `stores`, `price_reports`,
  `favorites`
- **Columns:** `snake_case` — `product_id`, `created_at`, `is_verified`
- **Foreign keys:** `<singular_table>_id` — `store_id`, `report_id`

## 2. Git branching

- **`main`** — stable code only. It must always install and run.
- **`feature/<task-id>-<short-description>`** — all development happens on
  feature branches named after the task in `docs/TASK_LIST.md`.

Examples:

```
feature/FIND-2-search-endpoint
feature/RPT-3-report-form
feature/CMP-4-availability-display
```

Rules:

- One task per branch. Keep branches short-lived.
- Pull `main` into your branch regularly to avoid big merge conflicts.
- Never commit directly to `main`. Never force-push shared branches.
- Delete your branch after it's merged.

## 3. Commit messages

Format: short imperative subject line (~50 chars), referencing the task ID
when applicable. Add a body only when the "why" isn't obvious.

Good:

```
Add product search endpoint (FIND-2)
Fix empty results when brand filter matches nothing
Seed stores table with campus-area test data
Update PRD with employee reporting responsibility
```

Bad:

```
changes
fixed stuff
wip final final v2
```

- Commit early and often, in logical units.
- Don't commit code that doesn't run.

## 4. Pull requests and code review

- Open a PR when your task's acceptance criteria (in `docs/TASK_LIST.md`)
  are met — not before.
- One feature per PR. Small PRs get reviewed faster and better.
- PR description must include: the task ID, what changed, and how you
  tested it. Add a screenshot (mobile viewport) for UI changes.
- **Every PR needs at least one teammate's approval before merging.** No
  self-merges, even for small fixes.
- Reviewers should check: does it work, does it follow these conventions,
  does it only do what the task requires, are there secrets or junk files.
- Address review comments with new commits or a reply — don't resolve
  silently.
- The author merges after approval.

## 5. Coordinating with teammates

- **Claim a task before starting.** Announce in the team channel which
  TASK_LIST item you're taking so two people don't build the same thing.
- **Shared files need extra care.** Before editing `package.json`,
  `vite.config.js`, `index.js`, `.gitignore`, or any migration, post a
  heads-up. These files cause the worst merge conflicts.
- **Never edit a migration that's already merged.** Schema changes go in a
  new migration file.
- **Adding a dependency?** Tell the team first and commit the lockfile
  (`package-lock.json`) so everyone gets identical installs.
- Hit a merge conflict in someone's code? Ask the author instead of
  guessing which side wins.
- Stuck more than ~30 minutes? Ask the team — don't silently struggle.

## 6. Before merging: minimum checks

There's no formal test suite yet, so "testing" means proving it works:

- `npm install` and `npm run dev` work cleanly in both `client/` and `api/`.
- The feature you're changing works end-to-end in the browser — click
  through the acceptance criteria in `docs/TASK_LIST.md`.
- No errors in the browser console or the API terminal.
- UI changes look right at mobile width (~375px) — SnackScout is
  mobile-first.
- Existing features still work (quick smoke test: search page loads, API
  health check responds).
- Once automated tests exist, they must pass before merge.

## 7. Security rules

- **Never commit secrets.** No passwords, API keys, Supabase service keys,
  tokens, or `.env` files. `.gitignore` covers these — don't remove the
  entries.
- Put required environment variables in `.env.example` with placeholder
  values so teammates know what to configure.
- If a secret gets committed by accident, treat it as compromised: rotate
  it immediately and tell the whole team.
- Don't log secrets or full request bodies in API code.
- Validate user input at the API boundary (e.g., price reports) — community
  data is untrusted.
- When the database arrives, use parameterized queries / the Supabase
  client. Never concatenate user input into SQL.
- Don't commit `node_modules/` or build output.

## 8. Working with Devin (AI assistant)

Devin is a team tool, not a team member — a human owns every line that
gets merged.

- **Review all AI-generated code before accepting it.** Read the diff. If
  you can't explain what it does, don't merge it.
- AI can invent plausible-but-wrong APIs, dependencies, or requirements.
  Verify code actually runs and meets the acceptance criteria in
  `docs/TASK_LIST.md`.
- **Reject scope creep.** If AI-generated changes add features or
  requirements nobody asked for (our PRD forbids inventing requirements),
  trim them.
- Keep AI-assisted changes small enough to review properly — one task at a
  time, same as human work.
- Never paste real secrets, `.env` contents, or credentials into AI
  prompts. Use placeholders.
- AI output goes through the same PR/review process as human code. No
  shortcuts.
- You are responsible for code you commit, regardless of who or what wrote
  the first draft.
