using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace Sofranet.Services;

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

    private string? ApiKey => _config["GoogleMaps:ApiKey"];

    private bool HasKey()
    {
        var k = ApiKey;
        return !string.IsNullOrWhiteSpace(k) && k != "your_api_key" && k != "placeholder";
    }

    public async Task<(double Lat, double Lng)?> GeocodeAddressAsync(string address)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;
        if (!HasKey()) return null;

        try
        {
            var url = $"https://maps.googleapis.com/maps/api/geocode/json?address={Uri.EscapeDataString(address)}&key={ApiKey}&region=tr&language=tr";
            var json = await _http.GetStringAsync(url);

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var status = root.GetProperty("status").GetString();
            if (status != "OK") return null;

            var results = root.GetProperty("results");
            if (results.GetArrayLength() == 0) return null;

            var loc = results[0].GetProperty("geometry").GetProperty("location");
            return (loc.GetProperty("lat").GetDouble(), loc.GetProperty("lng").GetDouble());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Geocode hatasi: {Address}", address);
            return null;
        }
    }

    public Task<double?> DistanceKmAsync(double lat1, double lng1, double lat2, double lng2)
    {
        // Sonra Distance Matrix API'ye geçilebilir, şimdilik haversine
        return Task.FromResult<double?>(HaversineKm(lat1, lng1, lat2, lng2));
    }

    public double HaversineKm(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371.0;
        double dLat = (lat2 - lat1) * Math.PI / 180.0;
        double dLng = (lng2 - lng1) * Math.PI / 180.0;

        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                 + Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0)
                 * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        return 2 * R * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}
