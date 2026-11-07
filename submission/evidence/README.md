# Verification evidence

These compact records derive from executed tools, not expected outputs:

- `backend-tests.json`: xUnit TRX counts and individual outcomes, real PostgreSQL.
- `frontend-tests.json`: Vitest JSON counts and named assertions.
- `playwright-production.json`: six actual browser workflows against Docker.
- `container-status.jsonl`: sanitized `docker compose ps` state and loopback ports.
- `container-smoke.json`: real HTTP health, SPA, security-header, authorization and CSRF probes.
- `restart-check.json`: the same browser session and task totals survive an API restart.
- `backend-audit.json` / `frontend-audit.json`: executed direct/transitive package audits.
- `merged-feature-prs.json`: merged GitHub feature history before the final documentation PR.
- `verification.json`: observed application revision, tools/checks and CI link.

Detailed CI logs are available from the linked GitHub Actions runs and retained workflow artifacts. Raw local traces/logs and generated credentials are deliberately excluded. Screenshot metadata records the actual production URL and capture time. The final handoff and source-package manifest identify the final main merge, which has identical application code plus this documentation.
