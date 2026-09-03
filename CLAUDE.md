# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ABC Healthcare Prior Authorization System — a demo full-stack app (React + ASP.NET Core 8 + PostgreSQL) built as the baseline for an SDD (Spec-Driven Development) + Claude Code CLI workshop. The intake/dashboard workflow for prior authorization requests is fully built; **Member Eligibility verification is intentionally missing** and is the feature the workshop adds via a `SPEC.md` (not yet present) using spec-driven development.

## Commands

### Database (must be running for the API to work)
```bash
docker compose up -d          # starts PostgreSQL on localhost:5432, auto-seeds via database/init.sql
docker compose ps             # check pa_db is "healthy"
docker compose down -v        # wipe volume and reset to fresh seed data
```

### Backend — `backend/PriorAuth.API`
```bash
cd backend/PriorAuth.API
dotnet run                    # http://localhost:5000, Swagger at /swagger
dotnet build
```
There is no test project in this repo yet. If one is added, it would be run with `dotnet test`.

### Frontend — `frontend`
```bash
cd frontend
npm install
npm run dev                   # Vite dev server, http://localhost:5173, proxies /api -> localhost:5000
npm run build                 # tsc typecheck + vite build
npm run preview
```
There is no lint or test tooling configured in `frontend/package.json` (no ESLint/Vitest/Jest). `npm run build`'s `tsc` step is the only automated check available for the frontend.

### Known local-setup gotcha
`backend/PriorAuth.API/appsettings.json`'s `DefaultConnection` string (`Username=postgres;Password=password_123`) does **not** match the credentials `docker-compose.yml` provisions for the `postgres` container (`pa_user`/`pa_password`, db `priorauth`). One of the two must be aligned before `dotnet run` can reach the database — check this first if the API fails to connect.

## Architecture

**Three independently-run pieces, no shared build**: Postgres (Docker) ↔ ASP.NET Core Web API (`backend/PriorAuth.API`, port 5000) ↔ React SPA (`frontend`, port 5173, Vite dev proxy forwards `/api/*` to the backend). There's no auth/session layer — all endpoints are open.

### Data model (`database/init.sql`, mirrored in `Models/Entities.cs`)
Five master/lookup tables — `health_plans`, `members`, `providers`, `sites`, `diagnosis_codes`, `procedure_codes` — all pre-seeded, all read-only from the app's perspective (only exposed via GET). The one transactional entity is `authorizations`, with two child tables (`authorization_procedures`, `authorization_diagnoses`) for the many-to-many CPT/ICD-10 codes attached to a request. `authorizations` FKs to every lookup table using `OnDelete(DeleteBehavior.SetNull)` (lookup deletion doesn't cascade-delete requests) while the procedure/diagnosis join tables use `ON DELETE CASCADE` from the `authorizations` side and `Restrict` on the code FK.

Primary keys are natural business keys, not surrogate ints, for most lookup tables: `patient_id` (`PTxxxxxx`), `physician_id` (`PHYxxx`), `site_id` (`SITExxx`), `diagnosis_code`/`procedure_code` (ICD-10/CPT strings). Only `health_plans` and `authorizations` use `SERIAL` PKs. `authorizations.reference_number` (format `PA-YYYYMMDD-XXXXX`) is generated in `AuthorizationsController.Create` at request time (random 5-digit suffix, not from `auth_ref_seq` despite that sequence existing in the schema) and is what's shown to users, not `authorization_id`.

### Backend layering
`Controllers` → `PriorAuthDbContext` (`Data/`) → EF Core → Postgres. `Controllers/LookupControllers.cs` holds one thin controller per lookup table (Members, Providers, Sites, HealthPlans, DiagnosisCodes, ProcedureCodes) — all follow the same pattern: optional `?name=`/`?q=` filter, `.Take(20)` when unfiltered, `.Take(50)`/`.Take(30)` when filtered, mapped straight to a DTO record. `Controllers/AuthorizationsController.cs` is the one stateful controller: `Create` writes the parent `Authorization` row, then the procedure/diagnosis child rows in a second `SaveChangesAsync`, then re-queries with full `Include`s to return the detail DTO; `UpdateStatus` validates against a hardcoded status list (`PENDING`, `APPROVED`, `DENIED`, `CANCELLED`, `IN_REVIEW`).

All API shapes are `record` DTOs in `DTOs/Dtos.cs` — controllers never return EF entities directly. `AuthorizationsController.MapToDetail` is the one place that assembles the full nested detail DTO (member/provider/plan/site/diagnoses/procedures) from a loaded `Authorization` entity; extend it if new related data needs to appear in the detail view.

### Frontend
`frontend/src/api/client.ts` is the single point of contact with the backend — one `api.<resource>.<verb>()` call per endpoint, all going through shared `get`/`post`/`patch` helpers. `frontend/src/types/index.ts` mirrors the backend DTOs field-for-field (comment at the top says so explicitly) plus adds frontend-only types: `WizardState` (accumulated multi-step form state) and the `PROGRAMS`/`STATUS_COLORS`/`STATUS_BG` constants used across pages.

Three routed pages (`App.tsx`): `DashboardPage` (list + status filter), `NewAuthorizationPage` (the 6-step wizard: Program → Provider → Health Plan → Member → Diagnosis & CPT → Site & Review), `AuthorizationDetailPage`. The wizard keeps all step state in one `WizardState` object in `NewAuthorizationPage`, gates forward navigation through a per-step `canProceed()` check, and lazy-loads lookup data per step (e.g. health plans are only fetched when step 2 completes) rather than loading everything up front. `SearchSelect.tsx` is the one shared component — a debounced type-ahead search-and-select used for provider/member/site lookups.

When adding a field that needs to flow end-to-end, the chain to update is: `database/init.sql` (column) → `Models/Entities.cs` (EF mapping) → `DTOs/Dtos.cs` (DTO record) → controller mapping code → `frontend/src/types/index.ts` (mirrored interface) → `frontend/src/api/client.ts` if a new endpoint/param is needed → the consuming page/component.
