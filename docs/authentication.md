# Authentication

Daymark uses ASP.NET Core Identity password hashing and a private cookie session, with no token storage in localStorage. Registering creates only the caller's personal account. User IDs are read from authenticated claims; clients never select the owner.

`daymark.session` is HttpOnly, SameSite=Strict, nonpersistent and expires after eight hours without sliding renewal. Secure follows the incoming request: the intended loopback HTTP environment works locally. Compose persists encrypted-cookie data-protection keys in a dedicated volume so restarts retain valid sessions. Native development uses ASP.NET Core's local development key ring.

Every mutating controller request validates a cookie/request antiforgery pair, including anonymous registration and login. The frontend requests a new token after identity changes. Identity locks an account for fifteen minutes after five failed password attempts. Login and registration share a per-IP fixed-window limit of twenty requests/minute. Tests explicitly raise this limit in their host to avoid throttling normal fixture setup; rate enforcement is tested independently.

Tasks/categories are private: list queries filter by current user, direct reads and mutations require owner equality, and foreign category assignment is rejected. Dashboard queries use the same owner predicate. Foreign and absent resources both return 404.

The account view edits display name and timezone; email changes, recovery mail, MFA and account deletion are not exposed. No external email service is configured.
