using System.Net;
using System.Net.Http.Json;
namespace Daymark.Tests;

[Collection("Postgres")]
public class AccountTests(ApiFixture app)
{
    [Theory]
    [InlineData("Egypt Standard Time", "Africa/Cairo")]
    [InlineData("Pacific Standard Time", "America/Los_Angeles")]
    public async Task Accepted_windows_timezones_are_stored_as_browser_compatible_iana_ids(string zone, string expected)
    {
        using var c = app.Browser();
        await ApiFixture.Csrf(c);
        var email = $"zone-{Guid.NewGuid():N}@example.test";
        var password = Guid.NewGuid().ToString() + "aA1!";
        Assert.Equal(HttpStatusCode.Created, (await c.PostAsJsonAsync("/api/account/register", new { email, password, displayName = "Fictional", timeZone = zone })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await c.PostAsJsonAsync("/api/account/login", new { email, password })).StatusCode);
        await ApiFixture.Csrf(c);
        var registered = await c.GetFromJsonAsync<System.Text.Json.JsonElement>("/api/account/profile");
        Assert.Equal(expected, registered.GetProperty("timeZone").GetString());
        var update = await c.PutAsJsonAsync("/api/account/profile", new { displayName = "Fictional", timeZone = zone });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        Assert.Equal(expected, (await update.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>()).GetProperty("timeZone").GetString());
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PutAsJsonAsync("/api/account/profile", new { displayName = "Fictional", timeZone = "Not/A/Zone" })).StatusCode);
    }

    [Fact]
    public async Task Registration_login_profile_logout_and_session_rejection()
    {
        using var c = app.Browser();
        Assert.Equal(HttpStatusCode.Unauthorized, (await c.GetAsync("/api/account/profile")).StatusCode);
        await ApiFixture.RegisterAndLogin(c);
        var profile = await c.GetFromJsonAsync<System.Text.Json.JsonElement>("/api/account/profile");
        Assert.Equal("Fictional Tester", profile.GetProperty("displayName").GetString());
        Assert.Equal(HttpStatusCode.OK, (await c.PutAsJsonAsync("/api/account/profile", new { displayName = "Updated", timeZone = "UTC" })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await c.PostAsync("/api/account/logout", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await c.GetAsync("/api/account/profile")).StatusCode);
    }
    [Fact]
    public async Task Csrf_and_invalid_registration_are_rejected()
    {
        using var c = app.Browser();
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsJsonAsync("/api/account/register", new { email = "x@example.test", password = "invalid", displayName = "X" })).StatusCode);
        await ApiFixture.Csrf(c);
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsJsonAsync("/api/account/register", new { email = "invalid", password = "short", displayName = "" })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await c.PostAsJsonAsync("/api/account/login", new { email = "unknown@example.test", password = "NotARealPassword!7" })).StatusCode);
    }
}
