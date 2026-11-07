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
    }
}
