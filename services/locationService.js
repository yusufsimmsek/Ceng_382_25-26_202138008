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
async function distanceMatrix(origin, destination) {
  if (!hasKey()) return null;
  if (!origin || !destination) return null;

  try {
    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json'
      + '?origins=' + origin.lat + ',' + origin.lng
      + '&destinations=' + destination.lat + ',' + destination.lng
      + '&key=' + API_KEY
      + '&units=metric';

    const r = await fetch(url);
    const data = await r.json();

    if (data.status === 'OK'
        && data.rows && data.rows[0]
        && data.rows[0].elements && data.rows[0].elements[0]
        && data.rows[0].elements[0].status === 'OK') {
      const el = data.rows[0].elements[0];
      return {
        distanceKm: el.distance.value / 1000,
        durationMin: el.duration.value / 60
      };
    }
    console.error('distance matrix hata:', data.status);
    return null;
  } catch (err) {
    console.error('distance matrix network hata:', err.message);
    return null;
  }
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
  hasKey
};
