# Daymark: Task 6 project summary

**Auspify Technologies Software Development Internship**

**Repository:** https://github.com/Jaclyn25/task-management-app
**Local application:** http://127.0.0.1:18084

Daymark is an original personal productivity workspace. It implements the five corrected official requirements: full task CRUD; categorization/prioritization; status tracking; due dates/deadlines; and a real progress dashboard. The unrelated online-examination guidelines are not used.

## Implemented experience

Register and sign in to a private account. Create categories and tasks with descriptions, four priorities, three statuses and optional start/due dates. Search/filter/sort/paginate tasks. Edit details, change status, complete/reopen, or confirm deletion. Monitor counts, completion percentage, recent tasks, deadline summaries and priority/status distributions. Use the three-column Kanban with keyboard-accessible status menus. Update display name and timezone in Account.

All metrics come from authenticated backend data. Empty workspaces explain how to begin. Date-only deadlines end in the account timezone; creation/update/completion instants are UTC. Completed tasks are excluded from current overdue results. Category deletion preserves its tasks as uncategorized. Version tokens prevent stale writes and lost updates.

## Engineering

ASP.NET Core 10, C#, Identity, EF Core and PostgreSQL 17; React/TypeScript/Vite/Tailwind, React Router, TanStack Query, React Hook Form, Zod and Recharts. Thin controllers, scoped services, validated DTOs, committed migrations, relational constraints, indexes, async queries, transactions and structured logging.

Security includes private ownership predicates, cookie sessions, password hashing, lockout, CSRF on writes, rate limiting, safe errors, same-origin proxying, non-root API runtime and loopback bindings. Automated tests use real PostgreSQL. Independent feature branches and meaningful PRs preserve delivery history.

## Reviewer start

1. Run `pwsh ./scripts/init-env.ps1` and `docker compose up --build --detach --wait --wait-timeout 180`.
2. Open http://127.0.0.1:18084 and register a fictional account.
3. Follow the core workflow above; see [setup](../docs/setup.md) for native development and optional demo data.
4. Review [test results](TEST-RESULTS.md), [delivery record](DELIVERY.md), [API](../docs/api.md) and [security](../docs/security.md).

No public deployment, repository visibility change or automatic Auspify submission is part of this delivery. Optional omissions are drag-and-drop, dark mode, recurring tasks, shared teams, email recovery, MFA and immutable activity history. Core personal task workflows are implemented.
