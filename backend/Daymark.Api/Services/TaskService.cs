using System.ComponentModel.DataAnnotations;
using Daymark.Api.Data;
using Microsoft.EntityFrameworkCore;
namespace Daymark.Api.Services;

public sealed record TaskInput([Required, StringLength(160, MinimumLength = 1)] string Title,
    [MaxLength(5000)] string Description, Guid? CategoryId, TaskPriority Priority, TaskState Status,
    DateOnly? StartDate, DateOnly? DueDate, Guid? Version);
public sealed record TaskView(Guid Id, string Title, string Description, Guid? CategoryId, string? CategoryName,
    TaskPriority Priority, TaskState Status, DateOnly? StartDate, DateOnly? DueDate,
    DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, DateTimeOffset? CompletedAt, Guid Version);
public sealed class TaskQuery
{
    [MaxLength(160)] public string? Search { get; set; }
    public Guid? CategoryId { get; set; }
    public TaskPriority? Priority { get; set; }
    public TaskState? Status { get; set; }
    [RegularExpression("^(all|overdue|upcoming|today|none)$")] public string Deadline { get; set; } = "all";
    [RegularExpression("^(updated|created|title|priority|due)$")] public string Sort { get; set; } = "updated";
    [Range(1, 100000)] public int Page { get; set; } = 1;
    [Range(1, 100)] public int PageSize { get; set; } = 20;
}
public sealed record PageResult<T>(List<T> Items, int Total, int Page, int PageSize);
public static class DeadlineRules
{
    public static DateOnly Today(DateTimeOffset instant, string zone) => DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(instant, TimeZoneInfo.FindSystemTimeZoneById(zone)).DateTime);
    public static bool IsOverdue(DateOnly? due, TaskState state, DateOnly today) => state != TaskState.Completed && due < today;
}
public sealed class TaskService(WorkspaceDb db, TimeProvider clock)
{
    private IQueryable<WorkItem> Owned(string owner) => db.Set<WorkItem>().Where(x => x.OwnerId == owner);
    public async Task<DateOnly> Today(string owner) => DeadlineRules.Today(clock.GetUtcNow(), await db.Users.Where(x => x.Id == owner).Select(x => x.TimeZone).SingleAsync());
    public async Task<PageResult<TaskView>> List(string owner, TaskQuery q)
    {
        var items = Owned(owner).AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q.Search)) { var term = q.Search.Trim().ToLower(); items = items.Where(x => x.Title.ToLower().Contains(term) || x.Description.ToLower().Contains(term)); }
        if (q.CategoryId is not null) items = items.Where(x => x.CategoryId == q.CategoryId);
        if (q.Priority is not null) items = items.Where(x => x.Priority == q.Priority);
        if (q.Status is not null) items = items.Where(x => x.Status == q.Status);
        var today = await Today(owner); var end = today.AddDays(7);
        items = q.Deadline switch
        {
            "overdue" => items.Where(x => x.Status != TaskState.Completed && x.DueDate < today),
            "today" => items.Where(x => x.Status != TaskState.Completed && x.DueDate == today),
            "upcoming" => items.Where(x => x.Status != TaskState.Completed && x.DueDate >= today && x.DueDate <= end),
            "none" => items.Where(x => x.DueDate == null),
            _ => items
        };
        var total = await items.CountAsync();
        items = q.Sort switch
        {
            "title" => items.OrderBy(x => x.Title).ThenBy(x => x.Id),
            "priority" => items.OrderByDescending(x => x.Priority).ThenBy(x => x.Id),
            "due" => items.OrderBy(x => x.DueDate == null).ThenBy(x => x.DueDate).ThenBy(x => x.Id),
            "created" => items.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id),
            _ => items.OrderByDescending(x => x.UpdatedAt).ThenBy(x => x.Id)
        };
        return new(await Project(items.Skip((q.Page - 1) * q.PageSize).Take(q.PageSize)).ToListAsync(), total, q.Page, q.PageSize);
    }
    public async Task<TaskView> Get(string owner, Guid id) => await Project(Owned(owner).AsNoTracking().Where(x => x.Id == id)).SingleOrDefaultAsync()
        ?? throw new DomainException(404, "Task not found.");
    public async Task<TaskView> Save(string owner, TaskInput r, Guid? id = null)
    {
        if (string.IsNullOrWhiteSpace(r.Title) || r.Title.Trim().Length > 160 || r.Description?.Length > 5000)
            throw new DomainException(400, "Provide a title of 1 to 160 characters and a description of at most 5000 characters.");
        if (!Enum.IsDefined(r.Priority) || !Enum.IsDefined(r.Status)) throw new DomainException(400, "Choose a supported priority and status.");
        if (r.StartDate > r.DueDate) throw new DomainException(400, "Due date must be on or after the start date.");
        if (r.CategoryId is not null && !await db.Set<Category>().AnyAsync(x => x.Id == r.CategoryId && x.OwnerId == owner))
            throw new DomainException(404, "Category not found.");
        var now = clock.GetUtcNow();
        var task = id is null ? new WorkItem { OwnerId = owner, CreatedAt = now } : await Owned(owner).SingleOrDefaultAsync(x => x.Id == id)
            ?? throw new DomainException(404, "Task not found.");
        if (id is not null && task.Version != r.Version) throw new DomainException(409, "This task changed. Reload before saving again.");
        task.Title = r.Title.Trim(); task.Description = r.Description?.Trim() ?? ""; task.CategoryId = r.CategoryId;
        task.Priority = r.Priority; task.StartDate = r.StartDate; task.DueDate = r.DueDate;
        task.CompletedAt = r.Status == TaskState.Completed ? task.CompletedAt ?? now : null;
        task.Status = r.Status; task.UpdatedAt = now; task.Version = Guid.NewGuid();
        if (id is null) db.Add(task);
        await Persist();
        return await Get(owner, task.Id);
    }
    public async Task Delete(string owner, Guid id, Guid version)
    {
        var task = await Owned(owner).SingleOrDefaultAsync(x => x.Id == id) ?? throw new DomainException(404, "Task not found.");
        if (task.Version != version) throw new DomainException(409, "This task changed. Reload before deleting.");
        db.Remove(task); await Persist();
    }
    private async Task Persist()
    {
        try { await db.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException) { throw new DomainException(409, "This task changed. Reload and try again."); }
        catch (DbUpdateException e) when (e.InnerException is Npgsql.PostgresException { SqlState: "23503" })
        { throw new DomainException(409, "The category was removed. Reload and try again."); }
    }
    public static IQueryable<TaskView> Project(IQueryable<WorkItem> q) => q.Select(x => new TaskView(x.Id, x.Title, x.Description, x.CategoryId,
        x.Category == null ? null : x.Category.Name, x.Priority, x.Status, x.StartDate, x.DueDate, x.CreatedAt, x.UpdatedAt, x.CompletedAt, x.Version));
}
