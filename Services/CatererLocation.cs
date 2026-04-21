namespace Sofranet.Services;

public class CatererLocation
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class CatererDistance : CatererLocation
{
    public double DistanceKm { get; set; }
}
