// form submit loading state - butona spinner ekle, 5sn sonra geri al (network sorununda kullanici kilitlemesin)
document.addEventListener('submit', function (e) {
  var form = e.target;
  if (form.hasAttribute('data-no-loading')) return;

  var btn = form.querySelector('button[type=submit]');
  if (!btn || btn.disabled) return;

  // multipart/form-data submit'leri (upload) genelde uzun surer; bu OK
  btn.dataset.originalText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>İşleniyor...';
  btn.disabled = true;

  setTimeout(function () {
    if (btn.dataset.originalText) {
      btn.innerHTML = btn.dataset.originalText;
      btn.disabled = false;
    }
  }, 5000);
});
