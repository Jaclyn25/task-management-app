# Database design

PostgreSQL 17, EF Core migrations and ASP.NET Core Identity tables. Migrations are committed; no in-memory database is substituted for integration tests.

| Entity | Important columns and relationships |
| --- | --- |
| WorkspaceUser | Identity string ID; email; normalized username; password hash; lockout; security/concurrency stamps; display name; timezone |
| Category | UUID ID; owner FK to user; name; normalized name; UUID concurrency version |
| WorkItem (`Tasks`) | UUID ID; owner FK; optional category FK; title; description; priority; status; date-only start/due; UTC created/updated/completed; UUID version |

One user owns many categories and tasks. A task has zero or one category. Category names are unique within an owner using `(OwnerId, NormalizedName)`. Identity's normalized username is unique. User deletion cascades owned records (no account deletion endpoint is exposed). Category deletion sets task category to null, and the business service updates affected versions/timestamps within the deletion transaction.

Task check constraints enforce title presence, known status/priority ranges, valid date ordering and the exact relationship between Completed status and non-null completion time. Lengths are constrained in the relational model. API services validate category ownership before assignment; owner IDs are derived from the session and cannot be supplied by clients.

Indexes cover `(OwnerId, Status, DueDate)`, `(OwnerId, Priority)`, `(OwnerId, UpdatedAt)` and category foreign keys. Search uses safe parameterized case-insensitive substring predicates; a larger deployment could add PostgreSQL text indexes after measuring query volume.

Updates and deletes compare opaque UUID version tokens. EF includes the original version in update/delete predicates. Competing writes return 409 rather than overwriting a winner. Category deletion is transactional. Analytics use Repeatable Read so counts and lists agree.

Deadline dates use PostgreSQL `date`; recorded instants use `timestamp with time zone`. An open task is overdue only when `dueDate < today` in the owner's timezone. An item due today remains current through the last instant of that local day. UTC instants are formatted in the profile timezone. A timezone change intentionally changes deadline classification without rewriting date-only commitments.

No reusable account credential or database dump is tracked. `scripts/capture.mjs` creates fictional sample records through the same API as the product.
