using Daymark.Api.Data;
using Microsoft.EntityFrameworkCore;
namespace Daymark.Api.Services;

public sealed record CategoryView(Guid Id, string Name, Guid Version, int TaskCount);
public sealed class CategoryService(WorkspaceDb db)
{
    public async Task<List<CategoryView>> List(string owner) => await db.Set<Category>().AsNoTracking()
        .Where(x => x.OwnerId == owner).OrderBy(x => x.Name)
        .Select(x => new CategoryView(x.Id, x.Name, x.Version, 0)).ToListAsync();
    public async Task<Category> Save(string owner, string name, Guid? id = null, Guid? version = null)
    {
        name = name.Trim();
        if (name.Length is < 1 or > 60) throw new DomainException(400, "Category names must contain 1 to 60 characters.");
        var category = id is null ? new Category { OwnerId = owner } : await Find(owner, id.Value);
        if (id is not null && category.Version != version) throw new DomainException(409, "Category changed. Reload and try again.");
        category.Name = name; category.NormalizedName = name.ToUpperInvariant(); category.Version = Guid.NewGuid();
        if (id is null) db.Add(category);
        try { await db.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException) { throw new DomainException(409, "Category changed. Reload and try again."); }
        catch (DbUpdateException e) when (e.InnerException is Npgsql.PostgresException { SqlState: "23505" })
        { throw new DomainException(409, "You already have a category with that name."); }
        return category;
    }
    public async Task Delete(string owner, Guid id, Guid version)
    {
        var category = await Find(owner, id);
        if (category.Version != version) throw new DomainException(409, "Category changed. Reload and try again.");
        db.Remove(category);
        try { await db.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException) { throw new DomainException(409, "Category changed. Reload and try again."); }
    }
    private async Task<Category> Find(string owner, Guid id) => await db.Set<Category>().SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == owner)
        ?? throw new DomainException(404, "Category not found.");
}
