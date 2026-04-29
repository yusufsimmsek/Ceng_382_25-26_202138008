// checkout sayfasi - kart numarasi formatlama + adres toggle
(function () {
  var num = document.getElementById('cardNumber');
  if (num) {
    num.addEventListener('input', function (e) {
      var v = e.target.value.replace(/\D/g, '').slice(0, 19);
      // 4'er gruplar
      var parts = [];
      for (var i = 0; i < v.length; i += 4) {
        parts.push(v.substring(i, i + 4));
      }
      e.target.value = parts.join(' ');
    });
  }

  var exp = document.getElementById('cardExpiry');
  if (exp) {
    exp.addEventListener('input', function (e) {
      var v = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) {
        e.target.value = v.substring(0, 2) + '/' + v.substring(2);
      } else {
        e.target.value = v;
      }
    });
  }

  var chk = document.getElementById('useProfile');
  var addr = document.getElementById('deliveryAddress');
  if (chk && addr) {
    chk.addEventListener('change', function () {
      addr.disabled = chk.checked;
      if (!chk.checked) addr.focus();
    });
  }
})();
