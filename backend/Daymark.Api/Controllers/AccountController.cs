using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Daymark.Api.Data;

namespace Daymark.Api.Controllers;

public sealed record RegisterRequest([Required, EmailAddress, MaxLength(254)] string Email,
    [Required, StringLength(128, MinimumLength = 12)] string Password,
    [Required, StringLength(80, MinimumLength = 1)] string DisplayName, string TimeZone = "UTC");
public sealed record LoginRequest([Required, EmailAddress, MaxLength(254)] string Email,
    [Required, MaxLength(128)] string Password);
public sealed record ProfileRequest([Required, StringLength(80, MinimumLength = 1)] string DisplayName,
    [Required, MaxLength(100)] string TimeZone);

[ApiController, Route("api/account")]
public sealed class AccountController(UserManager<WorkspaceUser> users, SignInManager<WorkspaceUser> signIn,
    IAntiforgery antiforgery) : ControllerBase
{
    [HttpGet("csrf")]
    public IActionResult Csrf() => Ok(new { token = antiforgery.GetAndStoreTokens(HttpContext).RequestToken });

    [HttpPost("register"), EnableRateLimiting("identity")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (!ValidZone(request.TimeZone)) return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]> { ["timeZone"] = ["Select a valid IANA timezone."] }));
        if (string.IsNullOrWhiteSpace(request.DisplayName)) return BadRequest(new ProblemDetails { Title = "Display name is required." });
        var user = new WorkspaceUser { UserName = request.Email.Trim(), Email = request.Email.Trim(), DisplayName = request.DisplayName.Trim(), TimeZone = request.TimeZone };
        var result = await users.CreateAsync(user, request.Password);
        if (!result.Succeeded) return BadRequest(new ProblemDetails { Title = "Registration could not be completed. Use a unique email and a stronger password." });
        return StatusCode(201, new { message = "Account created. Sign in to your workspace." });
    }

    [HttpPost("login"), EnableRateLimiting("identity")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await users.FindByEmailAsync(request.Email.Trim());
        // Perform a password hash even for unknown accounts to reduce enumeration through timing.
        if (user is null)
        {
            _ = users.PasswordHasher.HashPassword(new WorkspaceUser(), request.Password);
            return Unauthorized(new ProblemDetails { Title = "Email or password is incorrect." });
        }
        var result = await signIn.PasswordSignInAsync(user, request.Password, false, true);
        return result.Succeeded ? Ok(View(user)) : Unauthorized(new ProblemDetails { Title = "Email or password is incorrect, or the account is temporarily locked." });
    }

    [Authorize, HttpPost("logout")]
    public async Task<IActionResult> Logout() { await signIn.SignOutAsync(); return NoContent(); }

    [Authorize, HttpGet("profile")]
    public async Task<IActionResult> Profile() => Ok(View((await users.GetUserAsync(User))!));

    [Authorize, HttpPut("profile")]
    public async Task<IActionResult> Update(ProfileRequest request)
    {
        if (!ValidZone(request.TimeZone) || string.IsNullOrWhiteSpace(request.DisplayName))
            return BadRequest(new ProblemDetails { Title = "A display name and valid IANA timezone are required." });
        var user = (await users.GetUserAsync(User))!;
        user.DisplayName = request.DisplayName.Trim(); user.TimeZone = request.TimeZone;
        var result = await users.UpdateAsync(user);
        return result.Succeeded ? Ok(View(user)) : Conflict(new ProblemDetails { Title = "Profile changed. Reload and try again." });
    }

    private static object View(WorkspaceUser user) => new { user.Id, user.Email, user.DisplayName, user.TimeZone };
    private static bool ValidZone(string zone)
    {
        try { _ = TimeZoneInfo.FindSystemTimeZoneById(zone); return zone.Length <= 100; }
        catch (TimeZoneNotFoundException) { return false; }
        catch (InvalidTimeZoneException) { return false; }
    }
}

