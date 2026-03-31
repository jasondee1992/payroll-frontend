# AGENTS.md

## Project Overview

- Project: `payroll-frontend`
- Stack: Next.js App Router, React 19, TypeScript, Tailwind CSS 4
- Purpose: frontend workspace for the payroll system
- Backend pair: `/home/udot/PROJECTS/payroll-backend`

## Working Agreement

- Treat this repo as an internal operations app, not a marketing site.
- Prefer practical implementation over placeholder scaffolding.
- When wiring backend data, remove or clearly isolate static/mock values instead of mixing them invisibly with real data.
- Preserve established layout, spacing, and component patterns unless the task is explicitly a redesign.
- Keep edits small and composable; do not refactor unrelated modules while doing feature work.

## Run Commands

Frontend:

```bash
npm run dev
npm run lint
npm run build
```

Backend:

```bash
cd /home/udot/PROJECTS/payroll-backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Useful checks:

```bash
curl http://127.0.0.1:8000/api/v1/health
curl http://127.0.0.1:3000/api/backend-status
```

## Environment

Expected frontend env:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

The frontend also accepts `NEXT_PUBLIC_API_BASE_URL`, but `NEXT_PUBLIC_API_URL` is the current primary variable.

## Important Runtime Notes

- `next.config.ts` uses `distDir: ".next-runtime"` to avoid reuse of a previously corrupted `.next` dev cache.
- ESLint must ignore `.next-runtime`.
- Backend online/offline status is checked through `GET /api/backend-status` in the frontend, not by direct browser calls to FastAPI.
- If port `3000` is occupied, Next may start on `3001`; do not assume the dev port.
- Middleware-based auth protection is active, so protected routes may redirect before page code runs.

## Current Integration Status

Connected to backend:

- login/auth bridge
- logout flow
- middleware-based route protection
- employees list page
- backend health/offline status polling

Still mostly static/mock in the frontend:

- dashboard
- payroll pages
- reports
- payslips
- most non-employee dashboard modules

## Folder Responsibilities

- `src/app/`: routing, layouts, page entry points, route handlers
- `src/app/api/`: frontend-owned API bridges and status routes
- `src/components/auth/`: login/logout UI, auth status UI
- `src/components/layout/`: shell, header, sidebar, navigation wrappers
- `src/components/dashboard/`: dashboard-only presentation components
- `src/components/employees/`: employee domain presentation and forms
- `src/components/shared/`: reusable page-level shared UI
- `src/components/ui/`: lower-level generic UI wrappers
- `src/lib/api/`: fetch clients, endpoint constants, parsers, resource loaders
- `src/lib/auth/`: auth/session helpers

## Change Rules

- If a page already has a domain-specific API helper, extend that helper instead of adding raw `fetch()` inside the page.
- Prefer route handlers in `src/app/api/` when browser calls need cookie handling, proxying, or CORS isolation.
- Keep route protection logic centralized in middleware and auth helpers; do not duplicate redirect rules in multiple pages unless necessary.
- If a feature is still mock-driven, mark the integration boundary clearly in code and avoid implying the values are real.
- Do not remove the backend status polling unless replacing it with another live status mechanism.

## Auth Notes

- Frontend login accepts `username` or `email`.
- Frontend login posts to `/api/auth/login`, which proxies to FastAPI `POST /api/v1/auth/login`.
- Auth cookie name: `payroll_access_token`.
- Unauthenticated protected routes redirect to `/login`.

## Backend Status UI

- Global offline banner lives in `src/components/shared/backend-status-banner.tsx`
- Login page status card lives in `src/components/auth/login-backend-status-card.tsx`
- Client polling hook lives in `src/lib/api/use-backend-status.ts`
- Poll interval is currently `5000ms`

## Backend Integration Rules

- Primary backend base URL is `http://127.0.0.1:8000`.
- Backend APIs are versioned under `/api/v1`.
- Use the health endpoint first when diagnosing connectivity problems.
- For auth-related browser actions, prefer frontend proxy routes over direct browser-to-FastAPI requests.
- If a backend route is missing, document the mismatch rather than faking success in the UI.

## Codebase Conventions

- Prefer server components unless client interactivity is required.
- Put API access helpers under `src/lib/api/`.
- Put auth/session UI or helpers under `src/components/auth/` and `src/app/api/`.
- Keep UI copy concise and operational; avoid placeholder marketing text when wiring real data.
- Preserve the current visual language unless the task explicitly asks for redesign.
- Reuse existing `PageHeader`, `PageIntro`, `SectionCard`, and related shared UI before adding new wrappers.
- Keep tailwind utility usage consistent with existing files; do not introduce a parallel styling approach.
- Avoid introducing new state libraries or fetch libraries unless explicitly requested.

## Review Expectations

- For auth, routing, or runtime changes: verify redirect behavior and cookie-dependent flows.
- For backend-connected pages: verify both success state and backend-offline/error state.
- For static pages being converted to real data: make it obvious what is now real and what remains mocked.

## Suggested Workflow

1. Confirm whether the backend is expected to be running.
2. Check whether the target page is already wired to `src/lib/api/` helpers or still static.
3. Make the smallest viable change in the correct layer:
   page -> domain helper -> route handler -> shared utility.
4. Run `npm run lint`.
5. If the task touched runtime behavior, manually verify the affected route in the browser or with `curl`.

## Validation

Before finishing changes:

```bash
npm run lint
```

If touching routing/auth/runtime behavior, also verify:

- `/login`
- `/dashboard`
- `/api/backend-status`

If touching backend-connected employee flows, also verify:

- `/employees`
- `GET http://127.0.0.1:8000/api/v1/employees`

## Do Not Forget

- If dashboard crashes with old webpack or `_document.js` / `/_app` errors, suspect stale build artifacts first.
- If backend status shows offline, confirm FastAPI is actually running on `127.0.0.1:8000`.
- If login fails, verify the FastAPI user exists and the backend accepts `username_or_email`.
- If lint suddenly starts scanning generated output, confirm `.next-runtime/**` is still ignored in ESLint.
- If login works in FastAPI but fails in the UI, inspect the frontend proxy route before changing the backend contract.

