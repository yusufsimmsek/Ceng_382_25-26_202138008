// google maps + haversine yardimcilari
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function hasKey() {
  if (!API_KEY) return false;
  if (API_KEY === 'placeholder') return false;
  if (API_KEY.startsWith('your_')) return false;
  return true;
}

// adresten koordinat al
async function geocodeAddress(address) {
  if (!hasKey()) {
    return null;
  }
  if (!address || address.trim() === '') return null;

  try {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json'
      + '?address=' + encodeURIComponent(address)
      + '&key=' + API_KEY
      + '&region=tr&language=tr';

    const r = await fetch(url);
    const data = await r.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const loc = data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }
    console.error('geocode hata:', data.status, data.error_message || '');
    return null;
  } catch (err) {
    console.error('geocode network hata:', err.message);
    return null;
  }
}

// haversine - iki nokta arasi mesafe (km)
function distanceBetween(lat1, lng1, lat2, lng2) {
  const R = 6371; // km
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
          * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// google distance matrix api
// destination tek obje veya array olabilir
// tek ise -> { distanceKm, durationMin } veya null
// array ise -> [{ distanceKm, durationMin, status }, ...] veya null
async function distanceMatrix(origin, destination) {
  if (!hasKey()) return null;
  if (!origin || !destination) return null;

  const isArray = Array.isArray(destination);
  const destList = isArray ? destination : [destination];
  if (destList.length === 0) return isArray ? [] : null;

  try {
    const destParam = destList.map((d) => d.lat + ',' + d.lng).join('|');
    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json'
      + '?origins=' + origin.lat + ',' + origin.lng
      + '&destinations=' + encodeURIComponent(destParam)
      + '&key=' + API_KEY
      + '&units=metric';

    const r = await fetch(url);
    const data = await r.json();

    if (data.status !== 'OK' || !data.rows || !data.rows[0] || !data.rows[0].elements) {
      console.error('distance matrix hata:', data.status);
      return null;
    }

    const elements = data.rows[0].elements;
    const results = elements.map((el) => {
      if (el.status === 'OK') {
        return {
          distanceKm: el.distance.value / 1000,
          durationMin: el.duration.value / 60,
          status: 'OK'
        };
      }
      return { distanceKm: null, durationMin: null, status: el.status };
    });

    if (!isArray) {
      const first = results[0];
      if (first.status !== 'OK') return null;
      return { distanceKm: first.distanceKm, durationMin: first.durationMin };
    }
    return results;
  } catch (err) {
    console.error('distance matrix network hata:', err.message);
    return null;
  }
}

// yakindaki caterer'lari filtrele
// 1) haversine pre-filter (maxKm * 1.2 ile buffer)
// 2) eger api key varsa pre-filtered listede gercek mesafe icin Distance Matrix cagir
// 3) matrix sonucundan tekrar filtrele (gercek yol mesafesi <= maxKm)
// 4) matrix fail veya key yok ise haversine ile devam et
async function filterCaterersByDistance(caterers, userLoc, maxKm) {
  if (!userLoc || !caterers || caterers.length === 0) return [];

  // step 1 - haversine pre-filter
  const buffer = maxKm * 1.2;
  const candidates = [];
  for (const c of caterers) {
    if (c.latitude == null || c.longitude == null) continue;
    const lat = Number(c.latitude);
    const lng = Number(c.longitude);
    const d = distanceBetween(userLoc.lat, userLoc.lng, lat, lng);
    if (d <= buffer) {
      candidates.push({ ...c, distance: d });
    }
  }
  if (candidates.length === 0) return [];

  // step 2 - distance matrix (eger key varsa)
  if (hasKey()) {
    const destinations = candidates.map((c) => ({
      lat: Number(c.latitude),
      lng: Number(c.longitude)
    }));
    const matrix = await distanceMatrix(userLoc, destinations);

    if (matrix && Array.isArray(matrix)) {
      const filtered = [];
      for (let i = 0; i < candidates.length; i++) {
        const m = matrix[i];
        if (m && m.status === 'OK' && m.distanceKm <= maxKm) {
          filtered.push({ ...candidates[i], distance: m.distanceKm });
        }
      }
      filtered.sort((a, b) => a.distance - b.distance);
      return filtered;
    }
    // matrix fail - haversine fallback
  }

  // step 4 - haversine fallback
  const filtered = candidates.filter((c) => c.distance <= maxKm);
  filtered.sort((a, b) => a.distance - b.distance);
  return filtered;
}

function isNear(userLoc, catererLoc, maxKm) {
  if (!userLoc || !catererLoc) return false;
  const d = distanceBetween(userLoc.lat, userLoc.lng, catererLoc.lat, catererLoc.lng);
  return d <= maxKm;
}

module.exports = {
  geocodeAddress,
  distanceBetween,
  distanceMatrix,
  isNear,
  hasKey,
  filterCaterersByDistance
};
