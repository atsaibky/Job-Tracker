# JobTrackr

A Kanban-style job search tracker. Organize your job prospects across pipeline stages — from Bookmarked through Offer (or Rejected/Withdrawn). Drag and drop cards between columns, filter by interest level, and track target salaries. Built with React, Express, and PostgreSQL.

---

## Features

- **Drag-and-drop Kanban board**: Drag prospect cards between any of the 7 status columns. The status updates in the database immediately and persists across page refreshes.
- **Column highlighting**: When dragging a card, the target column highlights to indicate where it will land.
- **Interest level filtering**: Each column has an independent filter dropdown (All / High / Medium / Low). Column counts update to reflect the active filter.
- **Prospect management**: Create, edit, and delete prospects through dialog forms. Track company name, role title, job URL, interest level, target salary, and notes.
- **Target salary tracking**: Optional salary field displayed on cards with dollar formatting.

---

## File Structure

```
jobtrackr/
├── shared/
│   ├── schema.ts                    # Drizzle table definition, Zod schemas, TS types
│   ├── prospect-filters.ts          # Pure filter helper (filterByInterest)
│   └── __tests__/                   # Unit tests for shared logic
│       ├── prospect-filters.test.ts
│       ├── salary-validation.test.ts
│       └── status-transitions.test.ts
├── server/
│   ├── index.ts                     # Express app setup, middleware, server start
│   ├── db.ts                        # PostgreSQL connection pool via Drizzle ORM
│   ├── routes.ts                    # API route handlers for /api/prospects
│   ├── storage.ts                   # IStorage interface + DatabaseStorage implementation
│   ├── prospect-helpers.ts          # Pure functions: getNextStatus, validateProspect, isTerminalStatus
│   └── __tests__/                   # Server unit and integration tests
│       ├── prospect-validation.test.ts
│       └── routes-integration.test.ts
├── client/
│   ├── index.html                   # HTML entry point
│   └── src/
│       ├── App.tsx                  # Root component: providers, router
│       ├── main.tsx                 # Vite entry point, renders App
│       ├── pages/
│       │   └── home.tsx             # Kanban board with drag-and-drop, 7 status columns
│       ├── components/
│       │   ├── prospect-card.tsx    # Single prospect card (drag-aware, click to edit, hover for delete)
│       │   ├── add-prospect-form.tsx    # Dialog form for creating a new prospect
│       │   ├── edit-prospect-form.tsx   # Dialog form for editing an existing prospect
│       │   └── ui/                  # shadcn/ui component library (Button, Card, Dialog, etc.)
│       ├── hooks/
│       │   └── use-toast.ts         # Toast notification hook
│       └── lib/
│           ├── queryClient.ts       # TanStack Query client + apiRequest helper
│           └── utils.ts             # Tailwind class merge utility
├── e2e/                             # Playwright end-to-end test specs
│   ├── drag-and-drop.spec.ts
│   └── filter-and-salary.spec.ts
├── drizzle.config.ts                # Drizzle Kit config (points to shared/schema.ts)
├── jest.config.cjs                  # Jest config for unit/integration tests
├── playwright.config.ts             # Playwright config for E2E tests
├── tailwind.config.ts               # Tailwind theme tokens and plugin config
├── vite.config.ts                   # Vite config with path aliases (@, @shared, @assets)
├── tsconfig.json                    # TypeScript config
├── tsconfig.test.json               # TypeScript config for test files
└── package.json                     # Scripts: dev, build, start, db:push, test
```

---

## Tech Stack

| Layer       | Technology                                                            |
|-------------|-----------------------------------------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS, shadcn/ui, TanStack React Query, wouter |
| Drag & Drop | @hello-pangea/dnd                                                     |
| Backend     | Express.js (TypeScript)                                               |
| Database    | PostgreSQL, Drizzle ORM, drizzle-zod                                  |
| Testing     | Jest, supertest, Playwright                                           |

---

## Database Architecture

### Table: `prospects`

A single PostgreSQL table stores all job prospects. No joins, no relations.

| Column          | Type          | Constraints                         |
|-----------------|---------------|-------------------------------------|
| `id`            | `SERIAL`      | Primary key, auto-increment         |
| `company_name`  | `TEXT`         | NOT NULL                            |
| `role_title`    | `TEXT`         | NOT NULL                            |
| `job_url`       | `TEXT`         | Nullable                            |
| `status`        | `TEXT`         | NOT NULL, default `'Bookmarked'`    |
| `interest_level`| `TEXT`         | NOT NULL, default `'Medium'`        |
| `notes`         | `TEXT`         | Nullable                            |
| `target_salary` | `INTEGER`     | Nullable                            |
| `created_at`    | `TIMESTAMPTZ`  | NOT NULL, default `NOW()`           |

### Valid Values

**Status** (ordered pipeline stages):
`Bookmarked` → `Applied` → `Phone Screen` → `Interviewing` → `Offer`

Terminal/exit stages: `Rejected`, `Withdrawn`

**Interest Level**: `High`, `Medium`, `Low`

### ORM

The schema is defined in `shared/schema.ts` using Drizzle ORM. Column names use snake_case in the database but are accessed as camelCase in TypeScript (e.g., `company_name` → `companyName`). Validation uses Zod schemas generated from the Drizzle definition via `drizzle-zod`.

---

## Request Flow

### Example: Creating a prospect

```
Browser (React)
  └─ AddProspectForm submits form data
     └─ apiRequest("POST", "/api/prospects", data)        [client/src/lib/queryClient.ts]
        └─ fetch("/api/prospects", { method: "POST", body: JSON })
           └─ Express receives request                     [server/index.ts]
              └─ JSON body parsed by express.json()
              └─ Route handler matched                     [server/routes.ts]
                 └─ insertProspectSchema.safeParse(body)   [shared/schema.ts]
                 └─ storage.createProspect(parsed.data)    [server/storage.ts]
                    └─ db.insert(prospects).values(data)   [server/db.ts → PostgreSQL]
                 └─ res.status(201).json(prospect)
        └─ Response received by frontend
           └─ queryClient.invalidateQueries("/api/prospects")
              └─ Refetches GET /api/prospects → board updates
```

### Example: Dragging a card to a new column

```
Browser (React)
  └─ User drags card from "Bookmarked" to "Applied"
     └─ DragDropContext.onDragEnd fires                    [client/src/pages/home.tsx]
        └─ Extracts destination.droppableId = "Applied"
        └─ apiRequest("PATCH", "/api/prospects/3", { status: "Applied" })
           └─ Express route handler                        [server/routes.ts]
              └─ Validates status is in STATUSES array
              └─ storage.updateProspect(3, { status: "Applied" })
              └─ res.json(updatedProspect)
        └─ queryClient.invalidateQueries("/api/prospects")
           └─ Board re-renders with card in "Applied" column
```

### File responsibilities

| File                        | Role                                                        |
|-----------------------------|-------------------------------------------------------------|
| `shared/schema.ts`         | Single source of truth for data shape, validation, and types |
| `shared/prospect-filters.ts` | Pure function for filtering prospects by interest level     |
| `server/index.ts`          | Boots Express, adds JSON/URL parsing, logging middleware, starts server |
| `server/db.ts`             | Creates the PostgreSQL connection pool and Drizzle instance  |
| `server/routes.ts`         | Defines API endpoints, validates input, calls storage        |
| `server/storage.ts`        | Abstracts all database queries behind an interface           |
| `server/prospect-helpers.ts` | Pure functions for pipeline logic (no DB, no Express)      |
| `client/src/pages/home.tsx` | Fetches prospects, groups by status, renders drag-and-drop Kanban columns |
| `client/src/components/prospect-card.tsx` | Renders a single card, handles delete, opens edit dialog, drag-aware |
| `client/src/components/add-prospect-form.tsx` | Controlled form for creating a prospect          |
| `client/src/components/edit-prospect-form.tsx` | Controlled form for editing a prospect (all fields) |
| `client/src/lib/queryClient.ts` | Configures TanStack Query defaults and the `apiRequest` fetch wrapper |

---

## Testing

The project has three tiers of tests:

### Unit Tests (Jest)

Test pure logic with no database or server dependencies.

- `shared/__tests__/prospect-filters.test.ts` — Interest level filtering logic
- `shared/__tests__/salary-validation.test.ts` — Zod schema salary validation
- `shared/__tests__/status-transitions.test.ts` — Status enum validation via Zod schema
- `server/__tests__/prospect-validation.test.ts` — `validateProspect`, `getNextStatus`, `isTerminalStatus` helpers

### Integration Tests (Jest + supertest)

Test API routes with a mocked storage layer — no database required.

- `server/__tests__/routes-integration.test.ts` — All CRUD endpoints, input validation, error handling

### End-to-End Tests (Playwright)

Test full user flows in a real browser against a running app.

- `e2e/drag-and-drop.spec.ts` — Dragging cards between columns, count updates, filter interaction, persistence
- `e2e/filter-and-salary.spec.ts` — Interest filters, salary creation/editing/clearing, form validation

### Running Tests

```bash
# Unit and integration tests
npm test

# End-to-end tests (requires Chromium)
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=$(which chromium) npx playwright test
```

---

## Seed Data

To populate the database with sample prospects, run the following SQL against your PostgreSQL database:

```sql
INSERT INTO prospects (company_name, role_title, job_url, status, interest_level, notes)
SELECT * FROM (VALUES
  (
    'Google',
    'Product Manager, Cloud AI',
    'https://careers.google.com/jobs/results/123',
    'Interviewing',
    'High',
    'Had a great informational chat with the hiring manager. Team seems very collaborative. Preparing for case study round next week.'
  ),
  (
    'Stripe',
    'Business Operations Associate',
    'https://stripe.com/jobs/listing/biz-ops',
    'Applied',
    'High',
    'Applied through a Haas alum referral. Strong product-market fit with my background in fintech.'
  ),
  (
    'McKinsey & Company',
    'Associate Consultant',
    'https://mckinsey.com/careers',
    'Phone Screen',
    'Medium',
    'Passed the initial resume screen. Phone interview scheduled for next Thursday.'
  ),
  (
    'Salesforce',
    'Strategy & Operations Analyst',
    NULL,
    'Bookmarked',
    'Medium',
    'Saw this on LinkedIn. Need to research the team more before applying.'
  ),
  (
    'Airbnb',
    'Senior Product Analyst',
    'https://careers.airbnb.com/positions/5678',
    'Rejected',
    'Low',
    'Did not move past the initial screen. Will try again next recruiting cycle.'
  )
) AS v(company_name, role_title, job_url, status, interest_level, notes)
WHERE NOT EXISTS (SELECT 1 FROM prospects LIMIT 1);
```

The `WHERE NOT EXISTS` clause prevents duplicate inserts if data already exists.

---

## Running the App

1. Ensure a PostgreSQL database is attached (Replit provides this automatically)
2. Push the schema: `npm run db:push`
3. Start the app: `npm run dev`
4. Open the preview URL — the Kanban board loads at `/`

---

## API Reference

| Method   | Path                   | Description                              |
|----------|------------------------|------------------------------------------|
| `GET`    | `/api/prospects`       | Returns all prospects, newest first      |
| `POST`   | `/api/prospects`       | Creates a prospect (validates with Zod)  |
| `PATCH`  | `/api/prospects/:id`   | Updates provided fields on a prospect    |
| `DELETE` | `/api/prospects/:id`   | Deletes a prospect, returns 204          |
