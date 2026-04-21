namespace Sofranet.Services;

public interface ILocationService
{
    Task<(double Lat, double Lng)?> GeocodeAddressAsync(string address);

    double HaversineKm(double lat1, double lng1, double lat2, double lng2);

    Task<double?> DistanceKmAsync(double lat1, double lng1, double lat2, double lng2);

    Task<List<CatererDistance>> FilterCaterersByDistanceAsync(
        List<CatererLocation> caterers, double userLat, double userLng, double maxKm);

    bool HasApiKey();

    string? GetApiKey();
}
