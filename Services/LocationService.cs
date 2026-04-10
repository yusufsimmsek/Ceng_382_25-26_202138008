using Microsoft.Extensions.Logging;

namespace Sofranet.Services;

// Placeholder - gerçek Google Maps API entegrasyonu Prompt 5'te
public class LocationService : ILocationService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<LocationService> _logger;

    public LocationService(HttpClient http, IConfiguration config, ILogger<LocationService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public Task<(double lat, double lng)?> GeocodeAsync(string address)
    {
        // TODO: Google Geocoding API çağrısı
        return Task.FromResult<(double, double)?>(null);
    }

    public Task<double?> DistanceKmAsync(double lat1, double lng1, double lat2, double lng2)
    {
        // Google Distance Matrix yerine şimdilik haversine
        return Task.FromResult<double?>(HaversineKm(lat1, lng1, lat2, lng2));
    }

    // Standart haversine formülü
    public double HaversineKm(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371.0;
        double dLat = ToRad(lat2 - lat1);
        double dLng = ToRad(lng2 - lng1);
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                 + Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2))
                 * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRad(double deg) => deg * Math.PI / 180.0;
}
