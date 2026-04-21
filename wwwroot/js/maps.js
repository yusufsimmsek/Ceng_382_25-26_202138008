// Google Maps entegrasyonu - /Menu (liste) + /Menu/Detail haritalari
window.initMaps = function () {
    initMenuListMap();
    initMenuDetailMap();
};

document.addEventListener('DOMContentLoaded', function () {
    if (window.GMAPS_DISABLED) {
        document.querySelectorAll('#menuListMap, #menuDetailMap').forEach(function (el) {
            el.innerHTML = '<div class="map-fallback">Harita için Google Maps API anahtarı ayarlanmalı</div>';
        });
    }
});

function initMenuListMap() {
    var el = document.getElementById('menuListMap');
    if (!el || typeof google === 'undefined' || !google.maps) return;

    var userLat = parseFloat(el.dataset.userLat);
    var userLng = parseFloat(el.dataset.userLng);
    var caterers = [];
    try {
        caterers = JSON.parse(el.dataset.caterers || '[]');
    } catch (e) {
        caterers = [];
    }

    var center = (isFinite(userLat) && isFinite(userLng))
        ? { lat: userLat, lng: userLng }
        : { lat: 41.0082, lng: 28.9784 };

    var map = new google.maps.Map(el, { center: center, zoom: 12 });
    var bounds = new google.maps.LatLngBounds();

    if (isFinite(userLat) && isFinite(userLng)) {
        var userPos = new google.maps.LatLng(userLat, userLng);
        new google.maps.Marker({
            position: userPos,
            map: map,
            title: 'Konumun',
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2
            }
        });
        bounds.extend(userPos);
    }

    caterers.forEach(function (c) {
        if (!c.Latitude || !c.Longitude) return;
        var pos = new google.maps.LatLng(c.Latitude, c.Longitude);
        var marker = new google.maps.Marker({
            position: pos,
            map: map,
            title: c.Name,
            icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });
        var html = '<div><strong>' + escapeHtml(c.Name) + '</strong>';
        if (c.Address) html += '<br><small>' + escapeHtml(c.Address) + '</small>';
        if (typeof c.DistanceKm === 'number') {
            html += '<br><small>📍 ' + c.DistanceKm.toFixed(1) + ' km</small>';
        }
        html += '</div>';
        var info = new google.maps.InfoWindow({ content: html });
        marker.addListener('click', function () { info.open(map, marker); });
        bounds.extend(pos);
    });

    if (caterers.length > 0) {
        map.fitBounds(bounds);
    }

    // Collapse açıldıkça harita resize
    var collapseEl = document.getElementById('mapCollapse');
    if (collapseEl) {
        collapseEl.addEventListener('shown.bs.collapse', function () {
            google.maps.event.trigger(map, 'resize');
            map.setCenter(center);
        });
    }
}

function initMenuDetailMap() {
    var el = document.getElementById('menuDetailMap');
    if (!el || typeof google === 'undefined' || !google.maps) return;

    var lat = parseFloat(el.dataset.lat);
    var lng = parseFloat(el.dataset.lng);
    var name = el.dataset.name || 'Restoran';

    if (!isFinite(lat) || !isFinite(lng)) {
        el.innerHTML = '<div class="map-fallback">Konum bilgisi yok</div>';
        return;
    }

    var pos = { lat: lat, lng: lng };
    var map = new google.maps.Map(el, { center: pos, zoom: 15 });
    var marker = new google.maps.Marker({ position: pos, map: map, title: name });
    var info = new google.maps.InfoWindow({
        content: '<strong>' + escapeHtml(name) + '</strong>'
    });
    marker.addListener('click', function () { info.open(map, marker); });
}

function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}
