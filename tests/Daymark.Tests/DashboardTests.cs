using System.Net;
using System.Net.Http.Json;
using Daymark.Api.Data;
using Daymark.Api.Services;
namespace Daymark.Tests;
[Collection("Postgres")]
public class DashboardTests(ApiFixture app)
{
    [Fact]
    public async Task Dashboard_is_owned_and_matches_real_tasks_and_deadline_filters()
    {
        using var c = app.Browser(); using var other = app.Browser(); using var anon = app.Browser();
        await ApiFixture.RegisterAndLogin(c); await ApiFixture.RegisterAndLogin(other);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anon.GetAsync("/api/dashboard")).StatusCode);
        var empty = (await c.GetFromJsonAsync<DashboardView>("/api/dashboard"))!;
        Assert.Equal(0, empty.Total); Assert.Equal(0, empty.CompletionPercentage);
        await c.PostAsJsonAsync("/api/tasks", TaskTests.Input("Overdue") with { DueDate = empty.Today.AddDays(-1), Priority = TaskPriority.Urgent });
        await c.PostAsJsonAsync("/api/tasks", TaskTests.Input("Today") with { DueDate = empty.Today, Status = TaskState.InProgress });
        await c.PostAsJsonAsync("/api/tasks", TaskTests.Input("Finished") with { DueDate = empty.Today.AddDays(-2), Status = TaskState.Completed });
        var d = (await c.GetFromJsonAsync<DashboardView>("/api/dashboard"))!;
        Assert.Equal(3, d.Total); Assert.Equal(1, d.Completed); Assert.Equal(1, d.InProgress); Assert.Equal(1, d.ToDo);
        Assert.Equal(1, d.Overdue); Assert.Equal(1, d.Upcoming); Assert.Equal(33.3m, d.CompletionPercentage);
        Assert.Equal(3, d.Priorities.Sum(x => x.Count)); Assert.Equal(3, d.Statuses.Sum(x => x.Count));
        Assert.Equal(1, d.Progress.Sum(x => x.Completed));
        Assert.Single((await c.GetFromJsonAsync<PageResult<TaskView>>("/api/tasks?deadline=overdue"))!.Items);
        Assert.Single((await c.GetFromJsonAsync<PageResult<TaskView>>("/api/tasks?deadline=upcoming"))!.Items);
        Assert.Equal(0, (await other.GetFromJsonAsync<DashboardView>("/api/dashboard"))!.Total);
    }
}
