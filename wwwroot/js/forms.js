// Submit'te button loading state. data-no-loading attr ile bypass.
(function () {
    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (form.hasAttribute('data-no-loading')) return;

        var btn = form.querySelector('button[type=submit]');
        if (!btn || btn.disabled) return;

        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>İşleniyor...';
        btn.disabled = true;

        // Safety net: network hatası veya client-side validation fail durumunda 5 sn sonra reset
        setTimeout(function () {
            if (btn.disabled && btn.dataset.originalText) {
                btn.innerHTML = btn.dataset.originalText;
                btn.disabled = false;
            }
        }, 5000);
    });
})();
