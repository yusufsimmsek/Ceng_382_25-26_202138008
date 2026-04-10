namespace Sofranet.Services;

public interface ILocationService
{
    Task<(double lat, double lng)?> GeocodeAsync(string address);
    Task<double?> DistanceKmAsync(double lat1, double lng1, double lat2, double lng2);
    double HaversineKm(double lat1, double lng1, double lat2, double lng2);
}
