# API contract

All routes use `/api`, JSON and same-origin session cookies. OpenAPI is exposed at `/openapi/v1.json` in Development only. No anonymous private-resource routes exist.

## Session and CSRF

1. `GET /account/csrf` sets the HttpOnly antiforgery cookie and returns `{token}`.
2. Send this token in `X-CSRF-TOKEN` on every POST, PUT and DELETE, including registration and login.
3. `POST /account/register`: `{email,password,displayName,timeZone}`. Returns 201; does not sign in.
4. `POST /account/login`: `{email,password}`. Returns the profile and establishes the session.
5. Refresh `/account/csrf` after login/logout because tokens bind to the current identity.
6. `POST /account/logout` ends the session. `GET /account/profile` reads it; `PUT /account/profile` updates `{displayName,timeZone}`.

Registration requires a unique valid email, a nonblank name up to 80 characters and 12–128 password characters including uppercase, lowercase, digit and non-alphanumeric. Timezones must resolve on the server. Supported Windows timezone names are normalized to IANA identifiers before storage so returned profile values work in browser date formatting. The client uses IANA timezone identifiers.

## Tasks

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/tasks` | Paginated owner-filtered query |
| POST | `/tasks` | Create; returns 201 and Location |
| GET | `/tasks/{id}` | Read owned task |
| PUT | `/tasks/{id}` | Replace editable fields, requiring current version |
| DELETE | `/tasks/{id}?version={uuid}` | Delete owned task with current version |

Write fields: `title` (1–160 nonblank characters), `description` (up to 5000), `categoryId` (owned UUID or null), `priority` (0 Low, 1 Medium, 2 High, 3 Urgent), `status` (0 To Do, 1 In Progress, 2 Completed), `startDate`, `dueDate` (ISO `YYYY-MM-DD` or null), `version` (required for update). Server owns identifiers, owner and timestamps. Start cannot follow due date. All supported statuses can transition to each other; entering Completed records the finish instant, staying Completed preserves it, reopening clears it.

Responses include category name, UTC `createdAt`, `updatedAt`, nullable `completedAt`, and a new opaque UUID `version`. Returned dates remain date-only strings.

Query parameters: `search` (title/description, case-insensitive literal substring), `categoryId`, numeric `priority`, numeric `status`, `deadline` (`all`, `today`, `upcoming`, `overdue`, `none`), `sort` (`updated`, `created`, `title`, `priority`, `due`), `page` (1-based), `pageSize` (1–100; default 20). Response: `{items,total,page,pageSize}`. Sorts use an ID tie-breaker; priority is descending and null deadlines sort last. Upcoming includes today through today+7 in the profile timezone; completed tasks are excluded from active deadline filters.

## Categories and dashboard

`GET /categories` returns `{id,name,version,taskCount}[]`. `POST /categories` accepts `{name}`; `PUT /categories/{id}` accepts `{name,version}`; `DELETE /categories/{id}?version=…` preserves and uncategorizes tasks. Names are trimmed, limited to 60 characters, and case-insensitively unique per owner.

`GET /dashboard` returns real totals, status/priority distributions, overdue/upcoming counts, completion percentage, account-local today, timezone, seven-day daily completions, five recently updated tasks and six nearest open deadlines. Reads share a repeatable database snapshot. The progress chart counts tasks currently completed, grouped by their completion instant; reopening removes them from that chart.

`GET /health` checks database connectivity. It returns 200 or 503 without credentials or database details.

## Errors

400 for validation/CSRF; 401 for no session; 403 for authorization failure; 404 for absent or foreign-owned task/category; 409 for stale versions, duplicate categories or concurrently removed category; 429 for authentication rate limits. Domain and validation errors use Problem Details. Unexpected exceptions produce a safe generic response; detailed diagnostics stay in controlled server logs. Never blindly retry a write after a 409.
