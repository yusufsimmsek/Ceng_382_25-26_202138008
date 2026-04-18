namespace Sofranet.Models.ViewModels;

public class RecentCommentViewModel
{
    public string UserName { get; set; } = string.Empty;
    public int MenuRating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}
