(function () {
    // Kart numarası 4'er gruplama
    var cardInput = document.getElementById('cardNumberInput');
    if (cardInput) {
        cardInput.addEventListener('input', function (e) {
            var raw = e.target.value.replace(/\D/g, '').slice(0, 19);
            e.target.value = raw.replace(/(.{4})/g, '$1 ').trim();
        });
    }

    // Expiry MM/YY auto-slash
    var exp = document.getElementById('cardExpiryInput');
    if (exp) {
        exp.addEventListener('input', function (e) {
            var raw = e.target.value.replace(/\D/g, '').slice(0, 4);
            if (raw.length >= 3) {
                e.target.value = raw.slice(0, 2) + '/' + raw.slice(2);
            } else {
                e.target.value = raw;
            }
        });
    }

    // Profile/manual adres toggle
    var useProfile = document.getElementById('useProfileAddr');
    var profilePreview = document.getElementById('profileAddrPreview');
    var manualGroup = document.getElementById('manualAddrGroup');
    function toggleAddr() {
        if (!useProfile) return;
        if (useProfile.checked) {
            if (profilePreview) profilePreview.style.display = 'block';
            if (manualGroup) manualGroup.style.display = 'none';
        } else {
            if (profilePreview) profilePreview.style.display = 'none';
            if (manualGroup) manualGroup.style.display = 'block';
        }
    }
    if (useProfile) {
        useProfile.addEventListener('change', toggleAddr);
        toggleAddr();
    }
})();
