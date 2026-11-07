namespace Daymark.Api.Data;

public enum TaskPriority { Low, Medium, High, Urgent }
public enum TaskState { ToDo, InProgress, Completed }
public sealed class WorkItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OwnerId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public Guid? CategoryId { get; set; }
    public Category? Category { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public TaskState Status { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
}
