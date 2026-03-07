# JobTrackr

A Kanban-style job search tracker built with React, Express, and PostgreSQL. Prospects are organized into columns by pipeline status and can be created, edited, deleted, and **dragged between columns** through a clean card-based interface.

## Tech Stack

- **Frontend**: React 18 (Vite), Tailwind CSS, shadcn/ui, TanStack React Query, wouter, @hello-pangea/dnd
- **Backend**: Express.js (TypeScript), Drizzle ORM, node-postgres
- **Database**: PostgreSQL
- **Testing**: Jest (unit/integration), Playwright (E2E), supertest (HTTP integration)

## File Structure

```
shared/schema.ts              - Database table definition, Zod validation, TypeScript types
shared/prospect-filters.ts    - Pure filter helpers (filterByInterest) used by frontend
shared/__tests__/             - Unit tests for shared helpers (filters, salary, status)
server/
  index.ts                    - Express app bootstrap, middleware, server start
  db.ts                       - PostgreSQL connection pool (Drizzle)
  routes.ts                   - API route handlers (GET/POST/PATCH/DELETE)
  storage.ts                  - Storage interface + DatabaseStorage class
  prospect-helpers.ts         - Pure helper functions (getNextStatus, validateProspect, isTerminalStatus)
  __tests__/                  - Server unit tests and integration tests
client/src/
  App.tsx                     - Root component, routing, providers
  pages/home.tsx              - Kanban board with drag-and-drop, 7 status columns
  components/
    prospect-card.tsx         - Card component with edit/delete actions, drag-aware
    add-prospect-form.tsx     - Dialog form for creating prospects
    edit-prospect-form.tsx    - Dialog form for editing prospects
    ui/                       - shadcn/ui primitives
e2e/                          - Playwright E2E test specs
```

## Database

Single `prospects` table: id, company_name, role_title, job_url, status, interest_level, notes, target_salary, created_at.

- **Statuses**: Bookmarked, Applied, Phone Screen, Interviewing, Offer, Rejected, Withdrawn
- **Interest levels**: High, Medium, Low

## API

- `GET /api/prospects` - list all, ordered by created_at DESC
- `POST /api/prospects` - create (validated with Zod)
- `PATCH /api/prospects/:id` - partial update with field validation
- `DELETE /api/prospects/:id` - delete

## Features

- **Drag-and-drop**: Cards can be dragged between columns to change status. Columns highlight when hovered during drag. Status updates persist to the database.
- **Interest filtering**: Each column has an independent filter dropdown (All/High/Medium/Low).
- **Column counts**: Badge counts update dynamically based on active filters.

## Testing

- `npm test` runs all unit and integration tests (Jest, server + shared)
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=$(which chromium) npx playwright test` runs E2E tests (Playwright + Chromium)
- E2E tests live in `e2e/` directory, config in `playwright.config.ts`

## Running

- `npm run dev` starts the full app (Express + Vite)
- `npm run db:push` syncs schema to database
