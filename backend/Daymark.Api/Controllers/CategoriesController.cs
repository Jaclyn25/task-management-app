using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Daymark.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Daymark.Api.Controllers;

public sealed record CategoryRequest([Required, StringLength(60, MinimumLength = 1)] string Name, Guid? Version);
[ApiController, Authorize, Route("api/categories")]
public sealed class CategoriesController(CategoryService service) : ControllerBase
{
    private string Owner => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    [HttpGet] public async Task<IActionResult> List() => Ok(await service.List(Owner));
    [HttpPost] public async Task<IActionResult> Create(CategoryRequest r) { var c = await service.Save(Owner, r.Name); return StatusCode(201, new CategoryView(c.Id, c.Name, c.Version, 0)); }
    [HttpPut("{id:guid}")] public async Task<IActionResult> Update(Guid id, CategoryRequest r) { var c = await service.Save(Owner, r.Name, id, r.Version); return Ok(new CategoryView(c.Id, c.Name, c.Version, 0)); }
    [HttpDelete("{id:guid}")] public async Task<IActionResult> Delete(Guid id, [FromQuery] Guid version) { await service.Delete(Owner, id, version); return NoContent(); }
}
