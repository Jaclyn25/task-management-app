# Verification guide

## PostgreSQL backend suite

Create an independent `daymark_test` database on Daymark's PostgreSQL server, then run `pwsh ./scripts/test-backend.ps1`. The script sets `DAYMARK_TEST_CONNECTION` from ignored local configuration. Tests use WebApplicationFactory, real cookies/CSRF, EF migrations and real PostgreSQL queries. Each test creates unique fictional users; there is no destructive shared-database reset.

For another PostgreSQL server, set `DAYMARK_TEST_CONNECTION` and run `dotnet test -c Release`. Never point tests at real personal data.

Coverage includes account/session flows, validation, ownership for private resources, category uniqueness and safe detachment, task CRUD, priorities, status transitions, completion/reopening, stale writes/deletes, date ordering, deadline midnight boundaries, search/filter/sorting/pagination and real dashboard aggregation.

## Frontend

From `frontend`, run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm audit --audit-level=moderate`. Vitest/RTL tests use explicit API fixtures to isolate interaction behavior; they do not replace browser/API integration tests.

## Playwright

Start the native API and database, install Chromium with `npx playwright install chromium`, then run `npm run test:e2e` in `frontend`. Playwright starts Vite. `E2E_URL=http://127.0.0.1:18084` tests the production containers instead. `PLAYWRIGHT_CHANNEL=msedge` uses an installed Chromium-based Edge for local validation; CI uses bundled Chromium.

The browser suite registers users, creates/edits/completes/reopens/deletes tasks, manages categories/priorities, searches/filters, checks overdue reports, verifies unauthorized/cross-user access and mobile overflow. Board persistence is checked through its accessible status menu. Browser failures retain screenshots and traces under ignored test-results. Credentials are generated per test.

## Containers and CI

`docker compose up --build --detach --wait --wait-timeout 180` builds the API and frontend and waits for PostgreSQL/API/web health. `node scripts/smoke.mjs` checks the real local HTTP endpoint, CSP, anonymous private-route rejection and CSRF rejection. GitHub Actions runs backend/PostgreSQL, frontend, Chromium, dependency audit and container smoke jobs with ephemeral credentials. There is no deployment job.

Actual execution counts and CI links belong in `submission/TEST-RESULTS.md`. Do not interpret this coverage guide as a pass report.
