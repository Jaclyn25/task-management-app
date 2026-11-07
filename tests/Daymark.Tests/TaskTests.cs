using System.Net;
using System.Net.Http.Json;
using Daymark.Api.Data;
using Daymark.Api.Services;
namespace Daymark.Tests;

[Collection("Postgres")]
public class TaskTests(ApiFixture app)
{
    public static TaskInput Input(string title = "Plan the week", Guid? category = null) => new(title, "A fictional task", category, TaskPriority.High, TaskState.ToDo, null, DateOnly.FromDateTime(DateTime.UtcNow), null);
    [Fact]
    public async Task Lifecycle_versions_completion_reopening_and_delete()
    {
        using var c = app.Browser(); await ApiFixture.RegisterAndLogin(c);
        var input = Input();
        var created = await c.PostAsJsonAsync("/api/tasks", input); Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var task = (await created.Content.ReadFromJsonAsync<TaskView>())!;
        Assert.Null(task.CompletedAt); Assert.Equal(TaskPriority.High, task.Priority);
        var completed = await c.PutAsJsonAsync($"/api/tasks/{task.Id}", input with { Status = TaskState.Completed, Version = task.Version });
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
        var done = (await completed.Content.ReadFromJsonAsync<TaskView>())!; Assert.NotNull(done.CompletedAt);
        Assert.Equal(HttpStatusCode.Conflict, (await c.PutAsJsonAsync($"/api/tasks/{task.Id}", input with { Version = task.Version })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await c.DeleteAsync($"/api/tasks/{task.Id}?version={task.Version}")).StatusCode);
        var reopened = (await (await c.PutAsJsonAsync($"/api/tasks/{task.Id}", input with { Status = TaskState.InProgress, Version = done.Version })).Content.ReadFromJsonAsync<TaskView>())!;
        Assert.Null(reopened.CompletedAt);
        Assert.Equal(HttpStatusCode.NoContent, (await c.DeleteAsync($"/api/tasks/{task.Id}?version={reopened.Version}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await c.GetAsync($"/api/tasks/{task.Id}")).StatusCode);
    }
    [Fact]
    public async Task Every_private_task_route_and_category_assignment_enforces_ownership()
    {
        using var a = app.Browser(); using var b = app.Browser(); using var anon = app.Browser();
        await ApiFixture.RegisterAndLogin(a); await ApiFixture.RegisterAndLogin(b);
        var category = (await (await a.PostAsJsonAsync("/api/categories", new { name = "Private" })).Content.ReadFromJsonAsync<CategoryView>())!;
        var task = (await (await a.PostAsJsonAsync("/api/tasks", Input(category: category.Id))).Content.ReadFromJsonAsync<TaskView>())!;
        Assert.Equal(HttpStatusCode.Unauthorized, (await anon.GetAsync("/api/tasks")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anon.GetAsync("/api/categories")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await b.GetAsync($"/api/tasks/{task.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await b.PutAsJsonAsync($"/api/tasks/{task.Id}", Input() with { Version = task.Version })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await b.DeleteAsync($"/api/tasks/{task.Id}?version={task.Version}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await b.PostAsJsonAsync("/api/tasks", Input(category: category.Id))).StatusCode);
        Assert.Empty((await b.GetFromJsonAsync<PageResult<TaskView>>("/api/tasks"))!.Items);
        Assert.Equal(1, (await a.GetFromJsonAsync<List<CategoryView>>("/api/categories"))!.Single().TaskCount);
        Assert.Equal(HttpStatusCode.NoContent, (await a.DeleteAsync($"/api/categories/{category.Id}?version={category.Version}")).StatusCode);
        Assert.Null((await a.GetFromJsonAsync<TaskView>($"/api/tasks/{task.Id}"))!.CategoryId);
    }
    [Theory]
    [InlineData("", 1, 0)]
    [InlineData("  ", 1, 0)]
    [InlineData("Valid", 99, 0)]
    [InlineData("Valid", 1, 99)]
    public async Task Invalid_titles_and_enums_are_rejected(string title, int priority, int status)
    {
        using var c = app.Browser(); await ApiFixture.RegisterAndLogin(c);
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsJsonAsync("/api/tasks", Input(title) with { Priority = (TaskPriority)priority, Status = (TaskState)status })).StatusCode);
    }
    [Fact]
    public async Task Filters_search_sort_pagination_and_invalid_dates()
    {
        using var c = app.Browser(); await ApiFixture.RegisterAndLogin(c);
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsJsonAsync("/api/tasks", Input() with { StartDate = new(2030, 2, 2), DueDate = new(2030, 2, 1) })).StatusCode);
        await c.PostAsJsonAsync("/api/tasks", Input("Alpha") with { Priority = TaskPriority.Urgent });
        await c.PostAsJsonAsync("/api/tasks", Input("Beta") with { Priority = TaskPriority.Low });
        var found = (await c.GetFromJsonAsync<PageResult<TaskView>>("/api/tasks?search=alpha&priority=3&status=0"))!;
        Assert.Single(found.Items); Assert.Equal("Alpha", found.Items[0].Title);
        var page = (await c.GetFromJsonAsync<PageResult<TaskView>>("/api/tasks?sort=priority&pageSize=1&page=2"))!;
        Assert.Equal(2, page.Total); Assert.Equal("Beta", page.Items.Single().Title);
        Assert.Equal(HttpStatusCode.BadRequest, (await c.GetAsync("/api/tasks?page=0")).StatusCode);
    }
    [Theory]
    [InlineData("2026-11-07T21:59:59Z", false)]
    [InlineData("2026-11-07T22:00:00Z", true)]
    public void Deadline_ends_at_account_local_midnight(string instant, bool overdue)
    {
        var today = DeadlineRules.Today(DateTimeOffset.Parse(instant), "Africa/Cairo");
        Assert.Equal(overdue, DeadlineRules.IsOverdue(new DateOnly(2026, 11, 7), TaskState.ToDo, today));
        Assert.False(DeadlineRules.IsOverdue(new DateOnly(2026, 11, 7), TaskState.Completed, today));
    }
}
