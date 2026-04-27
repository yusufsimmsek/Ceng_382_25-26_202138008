// google maps gorsellestirme

function showFallback() {
  var list = document.getElementById('menuListMap');
  var detail = document.getElementById('menuDetailMap');
  var msg = '<div class="map-fallback">Harita gösterimi için API key gerekli.</div>';
  if (list) list.innerHTML = msg;
  if (detail) detail.innerHTML = msg;
}

// api yuklenmediyse fallback goster
if (window.GMAPS_DISABLED) {
  document.addEventListener('DOMContentLoaded', showFallback);
}

window.initMaps = function () {
  if (typeof google === 'undefined' || !google.maps) {
    showFallback();
    return;
  }

  if (document.getElementById('menuListMap')) {
    initMenuListMap();
  }
  if (document.getElementById('menuDetailMap')) {
    initMenuDetailMap();
  }
};

function initMenuListMap() {
  var div = document.getElementById('menuListMap');
  if (!div) return;

  var userLat = parseFloat(div.dataset.userLat);
  var userLng = parseFloat(div.dataset.userLng);
  var hasUser = !isNaN(userLat) && !isNaN(userLng);

  var caterers = [];
  try {
    caterers = JSON.parse(div.dataset.caterers || '[]');
  } catch (e) {
    console.error('caterer json parse hata:', e);
  }

  // default merkez - kullanici varsa onun konumu, yoksa istanbul
  var center = hasUser
    ? { lat: userLat, lng: userLng }
    : (caterers.length > 0
        ? { lat: Number(caterers[0].lat), lng: Number(caterers[0].lng) }
        : { lat: 41.0082, lng: 28.9784 });

  var map = new google.maps.Map(div, {
    center: center,
    zoom: 12,
    streetViewControl: false,
    mapTypeControl: false
  });

  var bounds = new google.maps.LatLngBounds();
  var markerCount = 0;

  if (hasUser) {
    var userPos = { lat: userLat, lng: userLng };
    new google.maps.Marker({
      position: userPos,
      map: map,
      title: 'Senin konumun',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });
    bounds.extend(userPos);
    markerCount++;
  }

  caterers.forEach(function (c) {
    var pos = { lat: Number(c.lat), lng: Number(c.lng) };
    var marker = new google.maps.Marker({
      position: pos,
      map: map,
      title: c.name
    });

    var info = new google.maps.InfoWindow({
      content:
        '<div style="min-width:160px;">' +
        '<b>' + escapeHtml(c.name) + '</b>' +
        (c.address ? '<div style="font-size:0.85em; color:#666; margin-top:4px;">' + escapeHtml(c.address) + '</div>' : '') +
        (c.distance != null ? '<div style="margin-top:4px;">📍 ' + Number(c.distance).toFixed(1) + ' km</div>' : '') +
        '</div>'
    });
    marker.addListener('click', function () {
      info.open(map, marker);
    });

    bounds.extend(pos);
    markerCount++;
  });

  if (markerCount > 1) {
    map.fitBounds(bounds);
  }
}

function initMenuDetailMap() {
  var div = document.getElementById('menuDetailMap');
  if (!div) return;

  var lat = parseFloat(div.dataset.lat);
  var lng = parseFloat(div.dataset.lng);
  if (isNaN(lat) || isNaN(lng)) {
    div.innerHTML = '<div class="map-fallback">Konum bilgisi yok.</div>';
    return;
  }

  var pos = { lat: lat, lng: lng };
  var map = new google.maps.Map(div, {
    center: pos,
    zoom: 15,
    streetViewControl: false,
    mapTypeControl: false
  });
  var marker = new google.maps.Marker({
    position: pos,
    map: map,
    title: div.dataset.name || ''
  });
  if (div.dataset.name) {
    var info = new google.maps.InfoWindow({
      content: '<b>' + escapeHtml(div.dataset.name) + '</b>'
    });
    marker.addListener('click', function () { info.open(map, marker); });
  }
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
