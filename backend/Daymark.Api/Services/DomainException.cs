using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
namespace Daymark.Api.Services;

public sealed class DomainException(int status, string message) : Exception(message)
{ public int Status { get; } = status; }
public sealed class DomainExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext c, Exception e, CancellationToken token)
    {
        if (e is not DomainException d) return false;
        c.Response.StatusCode = d.Status;
        await c.Response.WriteAsJsonAsync(new ProblemDetails { Status = d.Status, Title = d.Message }, token);
        return true;
    }
}
