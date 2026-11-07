using System.Security.Claims;
using Daymark.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Daymark.Api.Controllers;
[ApiController, Authorize, Route("api/tasks")]
public sealed class TasksController(TaskService tasks) : ControllerBase
{
    private string Owner => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    [HttpGet] public async Task<IActionResult> List([FromQuery] TaskQuery q) => Ok(await tasks.List(Owner, q));
    [HttpGet("{id:guid}")] public async Task<IActionResult> Get(Guid id) => Ok(await tasks.Get(Owner, id));
    [HttpPost] public async Task<IActionResult> Create(TaskInput r) { var t = await tasks.Save(Owner, r); return CreatedAtAction(nameof(Get), new { id = t.Id }, t); }
    [HttpPut("{id:guid}")] public async Task<IActionResult> Update(Guid id, TaskInput r) => Ok(await tasks.Save(Owner, r, id));
    [HttpDelete("{id:guid}")] public async Task<IActionResult> Delete(Guid id, [FromQuery] Guid version) { await tasks.Delete(Owner, id, version); return NoContent(); }
}
