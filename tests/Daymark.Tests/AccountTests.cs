using System.Net;
using System.Net.Http.Json;
namespace Daymark.Tests;

[Collection("Postgres")]
public class AccountTests(ApiFixture app)
{
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
