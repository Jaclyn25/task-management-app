# Security notes

The supported delivery is local, loopback-bound use. No public deployment is configured. Before any future public hosting, add HTTPS termination and correctly trusted proxy headers, force Secure cookies, manage key/database secrets operationally and review backups and monitoring.

Implemented controls: Identity password hashing; unique account names; private cookie sessions; CSRF validation for every write; SameSite=Strict/HttpOnly cookies; account lockout; per-IP auth limits; controller authorization; owner predicates; rejection of foreign category assignment; bounded field/query validation; EF parameterization; concurrency tokens; generic unexpected errors; JSON logging with sensitive EF parameters disabled; same-origin proxying without permissive CORS; Nginx CSP, framing/referrer/content-type headers; loopback-only published ports; ignored secrets and build contexts; no default credential.

The API runs as the image's non-root `app` user. Data-protection keys persist in a project-specific volume. Database/API are not exposed to a public interface. Logs do not capture request bodies/passwords. Development-only OpenAPI documents are not exposed in the production container.

Runtime account fixtures and demo credentials are fictional and generated. `.env`, `.local`, node_modules, build outputs and `.git` are excluded from source packaging. Do not attach database volumes or logs containing unexpected private input to a public issue.

The service intentionally does not include password reset mail, MFA or shared teams. Authentication rate limiting is process-local and shares the API-visible proxy IP in the local Nginx setup; multi-instance public infrastructure would need a reviewed trusted-client-IP and distributed limit design.

See test evidence for executed ownership, CSRF, rate-limit, conflict and dependency checks. Automated checks supplement a focused implementation review; they are not a penetration-test certification.
