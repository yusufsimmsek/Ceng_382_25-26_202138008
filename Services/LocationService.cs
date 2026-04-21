using System.Globalization;
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

    public bool HasApiKey()
    {
        var k = ApiKey;
        return !string.IsNullOrWhiteSpace(k) && k != "your_api_key" && k != "placeholder";
    }

    public string? GetApiKey() => HasApiKey() ? ApiKey : null;

    public async Task<(double Lat, double Lng)?> GeocodeAddressAsync(string address)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;
        if (!HasApiKey()) return null;

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

    public async Task<List<CatererDistance>> FilterCaterersByDistanceAsync(
        List<CatererLocation> caterers, double userLat, double userLng, double maxKm)
    {
        if (caterers == null || caterers.Count == 0)
            return new List<CatererDistance>();

        // 1. Haversine ile pre-filter (buffer x1.2)
        var preFiltered = caterers
            .Select(c => new
            {
                Caterer = c,
                HaversineKm = HaversineKm(userLat, userLng, c.Latitude, c.Longitude)
            })
            .Where(x => x.HaversineKm <= maxKm * 1.2)
            .ToList();

        if (preFiltered.Count == 0)
            return new List<CatererDistance>();

        // 2. API key yoksa Haversine sonucu ile dön
        if (!HasApiKey())
        {
            return preFiltered
                .Where(x => x.HaversineKm <= maxKm)
                .OrderBy(x => x.HaversineKm)
                .Select(x => Map(x.Caterer, x.HaversineKm))
                .ToList();
        }

        try
        {
            var inv = CultureInfo.InvariantCulture;
            var destinations = string.Join("|", preFiltered.Select(x =>
                $"{x.Caterer.Latitude.ToString(inv)},{x.Caterer.Longitude.ToString(inv)}"));
            var origin = $"{userLat.ToString(inv)},{userLng.ToString(inv)}";
            var url = $"https://maps.googleapis.com/maps/api/distancematrix/json?origins={origin}&destinations={Uri.EscapeDataString(destinations)}&key={ApiKey}&units=metric";

            var json = await _http.GetStringAsync(url);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (root.GetProperty("status").GetString() != "OK")
            {
                _logger.LogWarning("Distance Matrix non-OK status, fallback Haversine");
                return preFiltered
                    .Where(x => x.HaversineKm <= maxKm)
                    .OrderBy(x => x.HaversineKm)
                    .Select(x => Map(x.Caterer, x.HaversineKm))
                    .ToList();
            }

            var elements = root.GetProperty("rows")[0].GetProperty("elements");
            var results = new List<CatererDistance>();
            for (int i = 0; i < preFiltered.Count; i++)
            {
                var el = elements[i];
                if (el.GetProperty("status").GetString() != "OK") continue;
                var meters = el.GetProperty("distance").GetProperty("value").GetDouble();
                var km = meters / 1000.0;
                if (km <= maxKm)
                {
                    results.Add(Map(preFiltered[i].Caterer, km));
                }
            }
            return results.OrderBy(r => r.DistanceKm).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Distance Matrix hata, Haversine fallback");
            return preFiltered
                .Where(x => x.HaversineKm <= maxKm)
                .OrderBy(x => x.HaversineKm)
                .Select(x => Map(x.Caterer, x.HaversineKm))
                .ToList();
        }
    }

    private static CatererDistance Map(CatererLocation c, double km) => new CatererDistance
    {
        Id = c.Id,
        Name = c.Name,
        Address = c.Address,
        Latitude = c.Latitude,
        Longitude = c.Longitude,
        DistanceKm = km
    };
}
