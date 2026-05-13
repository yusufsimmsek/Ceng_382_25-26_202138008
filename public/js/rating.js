// star rating widget
(function () {
  var LABELS = ['', 'Çok kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];

  function init(container) {
    var target = container.dataset.target;
    var input = container.parentNode.querySelector('input[name="' + target + '"]');
    var labelEl = container.parentNode.querySelector('.rating-label');
    var stars = container.querySelectorAll('.star');
    var currentValue = 0;

    function paint(uptoValue) {
      stars.forEach(function (s) {
        var v = parseInt(s.dataset.value, 10);
        if (v <= uptoValue) s.classList.add('filled');
        else s.classList.remove('filled');
      });
    }

    function setLabel(v) {
      if (labelEl) labelEl.textContent = LABELS[v] || '';
    }

    stars.forEach(function (s) {
      s.addEventListener('mouseenter', function () {
        var v = parseInt(s.dataset.value, 10);
        paint(v);
        setLabel(v);
      });
      s.addEventListener('click', function () {
        var v = parseInt(s.dataset.value, 10);
        currentValue = v;
        if (input) input.value = v;
        paint(v);
        setLabel(v);
      });
    });

    container.addEventListener('mouseleave', function () {
      paint(currentValue);
      setLabel(currentValue);
    });
  }

  document.querySelectorAll('.star-rating').forEach(init);

  // submit oncesi iki rating'in de dolu oldugunu kontrol et
  var form = document.querySelector('form[action*="/rate"]');
  if (form) {
    form.addEventListener('submit', function (e) {
      var m = form.querySelector('input[name="menu_rating"]');
      var c = form.querySelector('input[name="caterer_rating"]');
      if (!m || !c || !m.value || !c.value) {
        e.preventDefault();
        alert('Lütfen iki bölüm için de puan ver');
      }
    });
  }
})();
