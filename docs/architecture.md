# Architecture

Daymark is an independent ASP.NET Core 10 and React workspace. Thin controllers delegate business rules to scoped services. EF Core and PostgreSQL provide relational persistence. Authentication uses Identity and same-origin cookies with antiforgery tokens. No public deployment is configured.

Feature branches start from synchronized main. Pull requests are merged after their checks pass. The initial commit bootstrapped an empty existing repository.
