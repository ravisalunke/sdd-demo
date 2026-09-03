# ABC Healthcare — Prior Authorization System
## React + ASP.NET Core 8 Web API + PostgreSQL

A clean, working prior authorization intake application.
Built as the baseline demo for the SDD + Claude Code CLI workshop.

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 18 + TypeScript + Vite            |
| Backend  | ASP.NET Core 8 Web API + EF Core 8      |
| Database | PostgreSQL 16 (via Docker)              |
| Styling  | Plain CSS (no framework)                |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)

---

## Quick Start (3 terminals)

### Terminal 1 — Start the database

```bash
docker compose up -d
```

PostgreSQL starts on `localhost:5432`.  
The init script seeds all master tables automatically.  
First start takes ~15 seconds. Check status:

```bash
docker compose ps
# pa_db should show "healthy"
```

### Terminal 2 — Start the API

```bash
cd backend/PriorAuth.API
dotnet run
```

API starts on `http://localhost:5000`.  
Swagger UI: `http://localhost:5000/swagger`

Verify:
```bash
curl http://localhost:5000/api/healthplans
# Should return 6 health plans
```

### Terminal 3 — Start the React app

```bash
cd frontend
npm install
npm run dev
```

App opens at `http://localhost:5173`

---

## What the App Does

**Dashboard** — lists all prior authorization requests with status filter.  
Click any row to view the full detail.

**New Request wizard** — 6 steps:
1. **Program** — select the clinical program (Orthopedics, Cardiology, etc.)
2. **Provider** — search and select the requesting physician
3. **Health Plan** — select the member's health plan
4. **Member** — search and select the patient
5. **Diagnosis & CPT** — add ICD-10 diagnosis codes + CPT procedure codes
6. **Site & Review** — select service site, add notes, review and submit

On submission, a reference number (`PA-YYYYMMDD-XXXXX`) is generated.

---

## Seed Data

All master tables are pre-seeded for demo use:

| Table          | Records |
|----------------|---------|
| Health Plans   | 6 (Cigna, Aetna, UHC, Blue Shield, Anthem, Molina) |
| Members        | 6 (PT001234 – PT001239) |
| Providers      | 5 (Orthopedics, Internal Med, Cardiology, GI, Psychiatry) |
| Sites          | 5 (various specialties, CA) |
| Diagnosis Codes | 12 (ICD-10) |
| Procedure Codes | 12 (CPT) |

---

## API Endpoints

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/healthplans                  | All health plans         |
| GET    | /api/members?name=                | Search members           |
| GET    | /api/members/{id}                 | Member by ID             |
| GET    | /api/providers?name=              | Search providers         |
| GET    | /api/sites?name=                  | Search sites             |
| GET    | /api/diagnosiscodes?q=            | Search diagnosis codes   |
| GET    | /api/procedurecodes?q=            | Search CPT codes         |
| GET    | /api/authorizations               | List authorizations      |
| GET    | /api/authorizations/{id}          | Authorization detail     |
| POST   | /api/authorizations               | Create authorization     |
| PATCH  | /api/authorizations/{id}/status   | Update status            |

---

## Project Structure

```
pa_app/
├── docker-compose.yml           ← PostgreSQL container
├── database/
│   └── init.sql                 ← Schema + seed data
├── backend/
│   └── PriorAuth.API/
│       ├── Controllers/
│       │   ├── LookupControllers.cs     ← Members, Providers, Sites, Plans, Codes
│       │   └── AuthorizationsController.cs
│       ├── Data/
│       │   └── PriorAuthDbContext.cs
│       ├── DTOs/
│       │   └── Dtos.cs
│       ├── Models/
│       │   └── Entities.cs
│       ├── Program.cs
│       └── appsettings.json
└── frontend/
    └── src/
        ├── api/client.ts        ← All API calls
        ├── types/index.ts       ← TypeScript types
        ├── components/
        │   └── SearchSelect.tsx ← Reusable search component
        ├── pages/
        │   ├── DashboardPage.tsx
        │   ├── NewAuthorizationPage.tsx
        │   └── AuthorizationDetailPage.tsx
        ├── App.tsx
        └── index.css
```

---

## Workshop Note

This application is the **starting point** for the SDD + Claude Code CLI workshop.

**What exists:** PA request creation workflow, all lookup endpoints, dashboard.  
**What is missing (intentionally):** Member Eligibility verification.

The workshop adds member eligibility using Spec-Driven Development:
- `SPEC.md` defines the new feature
- `CLAUDE.md` governs Claude Code CLI behavior
- Custom skills (`/spec-review`, `/hipaa-check`) verify each generation step

---

## Resetting the Database

```bash
docker compose down -v   # removes data volume
docker compose up -d     # recreates with fresh seed data
```
