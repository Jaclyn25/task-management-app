using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Daymark.Api.Data;

public sealed class WorkspaceUser : IdentityUser
{
    public string DisplayName { get; set; } = "";
    public string TimeZone { get; set; } = "UTC";
}

public sealed class WorkspaceDb(DbContextOptions<WorkspaceDb> options) : IdentityDbContext<WorkspaceUser>(options)
{
    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.Entity<WorkspaceUser>().Property(x => x.DisplayName).HasMaxLength(80);
        b.Entity<WorkspaceUser>().Property(x => x.TimeZone).HasMaxLength(100);
        b.Entity<Category>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(60);
            e.Property(x => x.NormalizedName).HasMaxLength(60);
            e.Property(x => x.Version).IsConcurrencyToken();
            e.HasIndex(x => new { x.OwnerId, x.NormalizedName }).IsUnique();
            e.HasOne<WorkspaceUser>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);
        });
        b.Entity<WorkItem>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(160);
            e.Property(x => x.Description).HasMaxLength(5000);
            e.Property(x => x.Version).IsConcurrencyToken();
            e.HasIndex(x => new { x.OwnerId, x.Status, x.DueDate });
            e.HasIndex(x => new { x.OwnerId, x.Priority });
            e.HasIndex(x => new { x.OwnerId, x.UpdatedAt });
            e.HasOne<WorkspaceUser>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull);
            e.ToTable("Tasks", t =>
            {
                t.HasCheckConstraint("CK_Task_Priority", "\"Priority\" BETWEEN 0 AND 3");
                t.HasCheckConstraint("CK_Task_Status", "\"Status\" BETWEEN 0 AND 2");
                t.HasCheckConstraint("CK_Task_Title", "length(trim(\"Title\")) > 0");
                t.HasCheckConstraint("CK_Task_Dates", "\"StartDate\" IS NULL OR \"DueDate\" IS NULL OR \"StartDate\" <= \"DueDate\"");
                t.HasCheckConstraint("CK_Task_Completion", "(\"Status\" = 2 AND \"CompletedAt\" IS NOT NULL) OR (\"Status\" <> 2 AND \"CompletedAt\" IS NULL)");
            });
        });
    }
}
