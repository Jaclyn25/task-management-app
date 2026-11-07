using System.Security.Claims;
using Daymark.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Daymark.Api.Controllers;
[ApiController, Authorize, Route("api/dashboard")]
public sealed class DashboardController(DashboardService service) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> Get() => Ok(await service.Get(User.FindFirstValue(ClaimTypes.NameIdentifier)!));
}
