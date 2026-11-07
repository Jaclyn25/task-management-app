# Executed verification

This report distinguishes actual executions from the coverage guide. Latest handoff evidence is in `submission/evidence/`.

| Check | Actual result |
| --- | --- |
| Backend xUnit / real PostgreSQL | 17 passed, 0 failed, 0 skipped |
| Vitest / React Testing Library | 11 passed |
| Playwright against production Docker | 6 passed, 0 failed (local Edge Chromium) |
| Playwright Chromium in GitHub Actions | 6 critical flows pass |
| TypeScript | Passed |
| ESLint | Passed, no warnings/errors after final formatting |
| Prettier source formatting | Passed |
| Native Release backend build | Passed |
| Frontend production build | Passed |
| NuGet direct/transitive audit | No vulnerable packages reported |
| npm dependency audit | 0 vulnerabilities |
| Docker builds and health | API, frontend and PostgreSQL healthy on loopback |
| Production HTTP smoke | Health, SPA, CSP, private-route 401 and missing-CSRF 400 pass |
| API container identity | Non-root uid/gid 1654 (`app`) |
| API restart persistence | Existing session remains valid and all 10 fictional demo tasks remain |

The complete container feature [CI run](https://github.com/Jaclyn25/task-management-app/actions/runs/42414647092) passed backend (53s), frontend (26s), Chromium (1m31s), containers (55s) and the secret scan. Production browser replay passed all six flows in 42.3s on 7 November 2026. Screenshots were recaptured from http://127.0.0.1:18084 at 23:14 Africa/Cairo. Final main CI is checked again at handoff.

## Verified behavior

Backend tests cover registration/login/logout/profile, unauthenticated rejection, CSRF on all write routes, task create/read/update/delete, blank/invalid inputs, owned categories, category duplicate names and safe removal, four priorities, status completion/reopening, version conflicts, competing edits with one winner, date ordering, timezone midnight boundaries, dashboard data/isolation, search/filter/sorting/pagination, rate limiting, cookie flags and account lockout.

Frontend interaction tests cover create/edit validation, invalid dates, concurrency-version submission, deletion confirmation, category/priority filters, status changes, overdue display, dashboard data, empty/error states, login validation and board updates. API fixtures isolate these interaction tests; browser/API/database tests provide end-to-end coverage.

Playwright runs register/login/create/edit/complete/reopen/delete/logout, category/priority/search/filter workflows, deadline/dashboard behavior, private-resource rejection across users, anonymous access, mobile navigation/overflow and durable board moves after reload. Local execution uses Microsoft Edge's Chromium engine; CI uses Playwright's bundled Chromium.

## Corrections during verification

- Registered MVC antiforgery filter dependencies after an initial integration failure.
- Updated a vulnerable transitive OpenAPI package and vulnerable frontend test/tool dependencies; both audits were rerun successfully.
- Used an explicit high-limit test host for fixture setup and a separate low-limit enforcement test.
- Corrected browser test locators to target native combobox roles and scoped mobile navigation.
- Retried registry downloads and seeded ignored local build caches during unreliable package networking. Clean CI uses ordinary package restores.
- Added unique dialog labels, hidden closed mobile navigation, formatted source and inherited Nginx security headers.

No failed run is reported as passing. Required final main/container verification is recorded in the final handoff evidence and CI links.
