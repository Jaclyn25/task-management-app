using System.Net.Http.Json;
using Daymark.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Daymark.Tests;

public sealed class ApiFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    public string Connection => Environment.GetEnvironmentVariable("DAYMARK_TEST_CONNECTION")
        ?? throw new InvalidOperationException("Set DAYMARK_TEST_CONNECTION to a dedicated real PostgreSQL test database.");
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, c) => c.AddInMemoryCollection(new Dictionary<string, string?>
        { ["ConnectionStrings:Workspace"] = Connection, ["Database:Migrate"] = "false", ["Security:IdentityRequestsPerMinute"] = "1000" }));
    }
    public async Task InitializeAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WorkspaceDb>();
        await db.Database.MigrateAsync();
    }
    async Task IAsyncLifetime.DisposeAsync() => await DisposeAsync();
    public HttpClient Browser() => CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
    public static async Task Csrf(HttpClient client)
    {
        var body = await client.GetFromJsonAsync<System.Text.Json.JsonElement>("/api/account/csrf");
        client.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");
        client.DefaultRequestHeaders.Add("X-CSRF-TOKEN", body.GetProperty("token").GetString());
    }
    public static async Task RegisterAndLogin(HttpClient c)
    {
        await Csrf(c);
        var email = $"person-{Guid.NewGuid():N}@example.test";
        var password = $"Test!7-{Guid.NewGuid():N}";
        Assert.Equal(System.Net.HttpStatusCode.Created, (await c.PostAsJsonAsync("/api/account/register", new { email, password, displayName = "Fictional Tester", timeZone = "Africa/Cairo" })).StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.OK, (await c.PostAsJsonAsync("/api/account/login", new { email, password })).StatusCode);
        await Csrf(c);
    }
}
[CollectionDefinition("Postgres")]
public class DatabaseCollection : ICollectionFixture<ApiFixture>;
