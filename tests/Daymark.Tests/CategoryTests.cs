using System.Net;
using System.Net.Http.Json;
using Daymark.Api.Services;
namespace Daymark.Tests;
[Collection("Postgres")]
public class CategoryTests(ApiFixture app)
{
    [Fact]
    public async Task Categories_are_private_unique_and_versioned()
    {
        using var a = app.Browser(); using var b = app.Browser();
        await ApiFixture.RegisterAndLogin(a); await ApiFixture.RegisterAndLogin(b);
        var response = await a.PostAsJsonAsync("/api/categories", new { name = "Focus" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var category = (await response.Content.ReadFromJsonAsync<CategoryView>())!;
        Assert.Empty((await b.GetFromJsonAsync<List<CategoryView>>("/api/categories"))!);
        Assert.Equal(HttpStatusCode.NotFound, (await b.PutAsJsonAsync($"/api/categories/{category.Id}", new { name = "Other", category.Version })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await b.DeleteAsync($"/api/categories/{category.Id}?version={category.Version}")).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await a.PostAsJsonAsync("/api/categories", new { name = " focus " })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await a.PutAsJsonAsync($"/api/categories/{category.Id}", new { name = "Planning", category.Version })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await a.DeleteAsync($"/api/categories/{category.Id}?version={category.Version}")).StatusCode);
        var current = (await a.GetFromJsonAsync<List<CategoryView>>("/api/categories"))!.Single();
        Assert.Equal(HttpStatusCode.NoContent, (await a.DeleteAsync($"/api/categories/{current.Id}?version={current.Version}")).StatusCode);
    }
}
