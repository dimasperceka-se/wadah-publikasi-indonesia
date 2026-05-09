# SciPub — Scientific Publication Platform

A full-stack scientific publication platform with multi-layer verification workflow (AI + human reviewers), multiple user roles, and a modern dark UI.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifact: sci-pub at `/`)
- API: Express 5 (artifact: api-server at `/api`)
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (jsonwebtoken) + bcryptjs
- AI Review: Anthropic Claude (via `@workspace/integrations-anthropic-ai`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/sci-pub/` — React + Vite frontend
- `artifacts/api-server/` — Express 5 API backend
- `lib/db/src/schema/` — Drizzle schema (users, papers, reviews, statusHistory)
- `lib/api-client-react/src/generated/` — Generated React Query hooks + Zod schemas
- `lib/api-zod/` — Server-side Zod schemas for request validation
- `lib/integrations-anthropic-ai/` — Anthropic AI client integration

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks + Zod schemas
- JWT stored in localStorage (`sci_pub_token`); attached via `setAuthTokenGetter` in custom-fetch
- AI review runs asynchronously after paper submission (non-blocking HTTP response)
- Paper status machine: DRAFT → SUBMITTED → AI_REVIEW → AI_PASSED/AI_FAILED → LAYER_2_REVIEW → LAYER_2_APPROVED → LAYER_3_REVIEW → LAYER_3_APPROVED → PUBLISHED (or REVISION_REQUESTED / REJECTED at any layer)
- DOI auto-generated on publication: `10.1234/scipub.<paperId>.<timestamp>`

## Product

### User Roles
- **GUEST** — Browse and read published papers
- **USER (Author)** — Submit papers, track review status, respond to revision requests
- **VERIFIER** — Layer 2 (L2) or Layer 3 (L3) peer reviewers; can approve, request revision, or reject
- **ADMIN** — Full access: manage users/roles, assign verifiers, override paper status, view analytics

### Review Pipeline
1. Author submits paper → AI analysis (Anthropic Claude)
2. If AI passes (score ≥ 75, no critical issues) → Layer 2 human review
3. Layer 2 approves → Layer 3 expert review
4. Layer 3 approves → Published with DOI

### Seed Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@scipub.com | Admin@123 | Admin |
| firman.perdana@scipub.com | Firman@123 | Verifier L2 |
| wikan@scipub.com | Wikan@123 | Verifier L2 |
| grandis@scipub.com | Grandis@123 | Verifier L3 |
| andi.pratama@gmail.com | Andi@123 | Author |
| siti.nurhaliza@gmail.com | Siti@123 | Author |
| budi.santoso@gmail.com | Budi@123 | Author |

## Gotchas

- Run `pnpm --filter @workspace/db run push` after any schema changes before starting the API server
- Run `pnpm --filter @workspace/api-spec run codegen` after OpenAPI spec changes
- `useGetPaperStats` → maps to `GET /api/papers/stats` (platform stats)
- `useGetAnalytics` → maps to `GET /api/admin/analytics` (admin-only detailed analytics)
- Papers keywords/co_authors are stored as PostgreSQL text arrays, returned as string[] in JSON

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
