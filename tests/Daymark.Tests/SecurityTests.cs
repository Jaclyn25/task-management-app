using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Daymark.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
namespace Daymark.Tests;
[Collection("Postgres")]
public class SecurityTests(ApiFixture app)
{
    [Fact]
    public async Task All_authenticated_write_routes_require_csrf()
    {
        using var c = app.Browser(); await ApiFixture.RegisterAndLogin(c);
        var task = (await (await c.PostAsJsonAsync("/api/tasks", TaskTests.Input())).Content.ReadFromJsonAsync<TaskView>())!;
        var category = (await (await c.PostAsJsonAsync("/api/categories",new {name="Protected"})).Content.ReadFromJsonAsync<CategoryView>())!;
        c.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");
        Assert.Equal(HttpStatusCode.BadRequest,(await c.PostAsJsonAsync("/api/tasks",TaskTests.Input())).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,(await c.PutAsJsonAsync($"/api/tasks/{task.Id}",TaskTests.Input() with {Version=task.Version})).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,(await c.DeleteAsync($"/api/tasks/{task.Id}?version={task.Version}")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,(await c.PostAsJsonAsync("/api/categories",new {name="Other"})).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,(await c.PutAsJsonAsync($"/api/categories/{category.Id}",new {name="Other",category.Version})).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,(await c.DeleteAsync($"/api/categories/{category.Id}?version={category.Version}")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,(await c.PutAsJsonAsync("/api/account/profile",new {displayName="Other",timeZone="UTC"})).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,(await c.PostAsync("/api/account/logout",null)).StatusCode);
    }
    [Fact]
    public async Task Competing_edits_have_exactly_one_winner()
    {
        using var c=app.Browser();await ApiFixture.RegisterAndLogin(c);
        var task=(await (await c.PostAsJsonAsync("/api/tasks",TaskTests.Input())).Content.ReadFromJsonAsync<TaskView>())!;
        var attempts=await Task.WhenAll(c.PutAsJsonAsync($"/api/tasks/{task.Id}",TaskTests.Input("First") with {Version=task.Version}),c.PutAsJsonAsync($"/api/tasks/{task.Id}",TaskTests.Input("Second") with {Version=task.Version}));
        Assert.Single(attempts,r=>r.StatusCode==HttpStatusCode.OK);Assert.Single(attempts,r=>r.StatusCode==HttpStatusCode.Conflict);
    }
    [Fact]
    public async Task Authentication_limit_is_enforced()
    {
        await using var limited=app.WithWebHostBuilder(b=>b.ConfigureAppConfiguration((_,c)=>c.AddInMemoryCollection(new Dictionary<string,string?> { ["Security:IdentityRequestsPerMinute"]="1" })));
        using var c=limited.CreateClient();await ApiFixture.Csrf(c);
        var input=new {email=$"unknown-{Guid.NewGuid():N}@example.test",password=Guid.NewGuid().ToString()};
        Assert.Equal(HttpStatusCode.Unauthorized,(await c.PostAsJsonAsync("/api/account/login",input)).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests,(await c.PostAsJsonAsync("/api/account/login",input)).StatusCode);
    }
    [Fact]
    public async Task Lockout_and_cookie_flags_are_real()
    {
        using var c=app.Browser();await ApiFixture.Csrf(c);
        var email=$"lockout-{Guid.NewGuid():N}@example.test";var password=Guid.NewGuid().ToString()+"aA1!";
        Assert.Equal(HttpStatusCode.Created,(await c.PostAsJsonAsync("/api/account/register",new {email,password,displayName="Fictional"})).StatusCode);
        var login=await c.PostAsJsonAsync("/api/account/login",new {email,password});
        var cookies=string.Join(';',login.Headers.GetValues("Set-Cookie"));Assert.Contains("httponly",cookies,StringComparison.OrdinalIgnoreCase);Assert.Contains("samesite=strict",cookies,StringComparison.OrdinalIgnoreCase);
        await ApiFixture.Csrf(c);await c.PostAsync("/api/account/logout",null);await ApiFixture.Csrf(c);
        for(var i=0;i<5;i++)Assert.Equal(HttpStatusCode.Unauthorized,(await c.PostAsJsonAsync("/api/account/login",new {email,password=Guid.NewGuid().ToString()})).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,(await c.PostAsJsonAsync("/api/account/login",new {email,password})).StatusCode);
    }
}

