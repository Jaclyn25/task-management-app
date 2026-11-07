# Delivery record and source packaging

Repository: https://github.com/Jaclyn25/task-management-app. The existing empty repository was bootstrapped with one initial `main` commit before feature branches could be created. No other repository was created, renamed, deleted or modified.

## Independent delivery branches

| Branch | Pull request | Scope |
| --- | --- | --- |
| `chore/project-foundation` | [#1](https://github.com/Jaclyn25/task-management-app/pull/1) | API foundation, logging, OpenAPI and build validation |
| `feat/authentication` | [#2](https://github.com/Jaclyn25/task-management-app/pull/2) | Identity, cookies, CSRF, PostgreSQL migration and account tests |
| `feat/categories` | [#3](https://github.com/Jaclyn25/task-management-app/pull/3) | Owned versioned categories and uniqueness |
| `feat/task-management` | [#4](https://github.com/Jaclyn25/task-management-app/pull/4) | Cohesive task lifecycle including priorities/status/deadlines and server queries |
| `feat/dashboard` | [#5](https://github.com/Jaclyn25/task-management-app/pull/5) | Real consistent account-scoped analytics |
| `feat/product-workspace` | [#6](https://github.com/Jaclyn25/task-management-app/pull/6) | React workspace, forms, lists, dashboard and browser tests |
| `feat/kanban-board` | [#7](https://github.com/Jaclyn25/task-management-app/pull/7) | Accessible durable board and per-column pagination |
| `test/security-and-critical-flows` | [#8](https://github.com/Jaclyn25/task-management-app/pull/8) | Cross-route CSRF, lockout/rate/cookies and competing edits |
| `chore/container-validation` | [#9](https://github.com/Jaclyn25/task-management-app/pull/9) | Three healthy services, secure Nginx, build/audit/smoke CI and maintainable formatting |
| `docs/submission-package` | [#10](https://github.com/Jaclyn25/task-management-app/pull/10) | Documentation, actual screenshots, execution evidence and reproducible packaging |

Feature branches use the user's requested names without a `codex/` prefix. Priorities, status and date invariants were implemented together in the task-lifecycle PR because they share one relational entity and write contract; no artificial empty feature PRs were created. Each branch started from the synchronized merged base. Changes were reviewed locally before merging after checks passed. This is author review, not a claim of an independent human approval.

Two unmerged feature commits were amended to remove secret-scanner false positives in generated-value expressions. Only those feature refs were updated with `--force-with-lease`. Main was never force-pushed, and no failing check was bypassed.

## Reproducible source ZIP

From a clean committed checkout:

```powershell
pwsh ./scripts/package-source.ps1
```

The script reads the current full commit SHA, runs `git archive --format=zip --prefix=daymark/ HEAD`, checks prohibited paths, and writes:

- `.local/daymark-source-<12-character-sha>.zip`
- The matching `.zip.sha256` checksum sidecar
- `.local/package-manifest.json` with source commit, absolute archive path and SHA-256

Only committed source, docs, screenshots and verification evidence are included. `.env`, secrets, `.local`, database volumes/dumps, node_modules, bin/obj, generated build/test directories, temporary files and `.git` are excluded. `.env.example` is a non-secret configuration example and is intentionally included. Run the command twice on the same commit to reproduce the same ZIP checksum.

The package identifies its exact source through the manifest and Git archive metadata. The final merge SHA is reported at handoff; embedding a commit's own SHA inside its source would create a circular reference.

## Submission boundary

Review the README, screenshot index, executed results, source package and checksum before manually submitting to Auspify. No portal submission or public deployment is performed. Repository visibility is unchanged. Local secrets and database data must remain local.
