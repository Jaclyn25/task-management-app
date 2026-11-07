# Setup

## Docker Desktop

Use Linux containers and Docker Compose v2. From the repository root, run:

```powershell
pwsh ./scripts/init-env.ps1
docker compose up --build --detach --wait --wait-timeout 180
docker compose ps
```

Open http://127.0.0.1:18084 and create an account. Use the same hostname throughout a session. There is no shared default account or committed password. `.env` is ignored and contains a locally generated database secret. Never copy it into submission archives.

The `daymark` Compose project owns its PostgreSQL and data-protection volumes. PostgreSQL is available only on `127.0.0.1:54334`. The web service binds only `127.0.0.1:18084`; the API is internal. Library, Inventory and Examination retain their existing ports and volumes.

`docker compose stop` stops services. `docker compose down` removes this project's containers and network but preserves data. Removing volumes erases records and session keys; avoid doing so unless you intend to reset the workspace.

## Native development

Requires .NET SDK 10, Node 24 LTS (Node 22.13+ also works), PowerShell 7 and a running PostgreSQL 17 server.

```powershell
pwsh ./scripts/init-env.ps1
docker compose up -d db
docker compose exec -T db createdb -U daymark daymark_test
dotnet tool restore
dotnet restore
pwsh ./scripts/start-api.ps1
```

In another terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Web: http://127.0.0.1:5177. API: http://127.0.0.1:5084/api/health. Development OpenAPI: http://127.0.0.1:5084/openapi/v1.json. Migrations apply when `Database__Migrate=true`; the startup script sets it. There is no CORS requirement because Vite and Nginx proxy `/api` on the same origin.

On Linux/macOS copy `.env.example` to ignored `.env`, replace the placeholder with a random secret, and use Compose. For native API startup set `ConnectionStrings__Workspace`, `Database__Migrate=true`, `ASPNETCORE_ENVIRONMENT=Development` and run the API on port 5084.

## Fictional demo and screenshots

With the Docker app running and frontend dependencies installed:

```powershell
cd frontend
npx playwright install chromium
cd ..
node scripts/capture.mjs
```

This creates a new fictional account, four categories and ten sample tasks through the real API, captures the running screens, and saves generated credentials only in ignored `.local/demo-account.json`. Each execution creates an independent account. It never uses real personal records. `CAPTURE_URL` overrides the target URL; `PLAYWRIGHT_CHANNEL=msedge` uses installed Edge instead of bundled Chromium.

## Troubleshooting

- A database health error usually means Docker is stopped or `.env` does not match an already initialized database volume. Preserve the original secret and data; changing the environment value does not rotate a PostgreSQL password.
- A 409 means a task/category changed since it was loaded. Reload and review the current record before saving.
- A 400 on a write may indicate an expired CSRF/session pairing. Sign in again.
- A 429 means authentication attempts exceeded the per-IP minute limit. Wait before retrying.
- Use `docker compose logs api web db` for diagnostics. Logs omit request bodies and sensitive EF parameter values.
