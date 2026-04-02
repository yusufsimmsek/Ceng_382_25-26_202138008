using Lab3.Models.Media;

namespace Lab3.Models.ViewModels.Home;

public class HomeIndexViewModel
{
    public IReadOnlyList<ImageModel> Images { get; init; } = [];
}
