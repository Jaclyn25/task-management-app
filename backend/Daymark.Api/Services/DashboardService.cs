using System.Data;
using Daymark.Api.Data;
using Microsoft.EntityFrameworkCore;
namespace Daymark.Api.Services;

public sealed record Distribution(string Name, int Count);
public sealed record ProgressPoint(string Day, int Completed);
public sealed record DashboardView(int Total, int ToDo, int InProgress, int Completed, int Overdue, int Upcoming,
    decimal CompletionPercentage, DateOnly Today, string TimeZone, List<Distribution> Priorities, List<Distribution> Statuses,
    List<ProgressPoint> Progress, List<TaskView> RecentTasks, List<TaskView> Deadlines);
public sealed class DashboardService(WorkspaceDb db, TimeProvider clock)
{
    public async Task<DashboardView> Get(string owner)
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead);
        var zone = await db.Users.Where(x => x.Id == owner).Select(x => x.TimeZone).SingleAsync();
        var today = DeadlineRules.Today(clock.GetUtcNow(), zone); var end = today.AddDays(7);
        var q = db.Set<WorkItem>().AsNoTracking().Where(x => x.OwnerId == owner);
        var total = await q.CountAsync();
        var grouped = await q.GroupBy(x => x.Status).Select(g => new { Status = g.Key, Count = g.Count() }).ToListAsync();
        int Count(TaskState s) => grouped.SingleOrDefault(x => x.Status == s)?.Count ?? 0;
        var priorities = await q.GroupBy(x => x.Priority).Select(g => new { Priority = g.Key, Count = g.Count() }).ToListAsync();
        var overdue = await q.CountAsync(x => x.Status != TaskState.Completed && x.DueDate < today);
        var upcoming = await q.CountAsync(x => x.Status != TaskState.Completed && x.DueDate >= today && x.DueDate <= end);
        var earliest = TimeZoneInfo.ConvertTimeToUtc(today.AddDays(-6).ToDateTime(TimeOnly.MinValue), TimeZoneInfo.FindSystemTimeZoneById(zone));
        var completions = await q.Where(x => x.CompletedAt >= earliest).Select(x => x.CompletedAt!.Value).ToListAsync();
        var progress = Enumerable.Range(-6, 7).Select(i => today.AddDays(i)).Select(d => new ProgressPoint(d.ToString("yyyy-MM-dd"), completions.Count(c => DeadlineRules.Today(c, zone) == d))).ToList();
        var recent = await TaskService.Project(q.OrderByDescending(x => x.UpdatedAt).ThenBy(x => x.Id).Take(5)).ToListAsync();
        var deadlines = await TaskService.Project(q.Where(x => x.Status != TaskState.Completed && x.DueDate != null)
            .OrderBy(x => x.DueDate).ThenBy(x => x.Id).Take(6)).ToListAsync();
        var view = new DashboardView(total, Count(TaskState.ToDo), Count(TaskState.InProgress), Count(TaskState.Completed), overdue, upcoming,
            total == 0 ? 0 : Math.Round(100m * Count(TaskState.Completed) / total, 1), today, zone,
            Enum.GetValues<TaskPriority>().Select(p => new Distribution(p.ToString(), priorities.SingleOrDefault(x => x.Priority == p)?.Count ?? 0)).ToList(),
            [new("To Do", Count(TaskState.ToDo)), new("In Progress", Count(TaskState.InProgress)), new("Completed", Count(TaskState.Completed))], progress, recent, deadlines);
        await tx.CommitAsync(); return view;
    }
}
