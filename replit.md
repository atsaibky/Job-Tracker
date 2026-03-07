# JobTrackr

A Kanban-style job search tracker built with React, Express, and PostgreSQL. Prospects are organized into columns by pipeline status and can be created, edited, and deleted through a clean card-based interface.

## Tech Stack

- **Frontend**: React 18 (Vite), Tailwind CSS, shadcn/ui, TanStack React Query, wouter
- **Backend**: Express.js (TypeScript), Drizzle ORM, node-postgres
- **Database**: PostgreSQL

## File Structure

```
shared/schema.ts              - Database table definition, Zod validation, TypeScript types
shared/prospect-filters.ts    - Pure filter helpers (filterByInterest) used by frontend
shared/__tests__/             - Unit tests for shared helpers
server/
  index.ts                    - Express app bootstrap, middleware, server start
  db.ts                       - PostgreSQL connection pool (Drizzle)
  routes.ts                   - API route handlers (GET/POST/PATCH/DELETE)
  storage.ts                  - Storage interface + DatabaseStorage class
  prospect-helpers.ts         - Pure helper functions (getNextStatus, validateProspect, isTerminalStatus)
client/src/
  App.tsx                     - Root component, routing, providers
  pages/home.tsx              - Kanban board with 7 status columns
  components/
    prospect-card.tsx         - Card component with edit/delete actions
    add-prospect-form.tsx     - Dialog form for creating prospects
    edit-prospect-form.tsx    - Dialog form for editing prospects
    ui/                       - shadcn/ui primitives
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

## Running

- `npm run dev` starts the full app (Express + Vite)
- `npm run db:push` syncs schema to database
- `npm test` runs all unit tests (server + shared)
