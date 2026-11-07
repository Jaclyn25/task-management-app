namespace Daymark.Api.Data;
public sealed class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OwnerId { get; set; } = "";
    public string Name { get; set; } = "";
    public string NormalizedName { get; set; } = "";
    public Guid Version { get; set; } = Guid.NewGuid();
}
