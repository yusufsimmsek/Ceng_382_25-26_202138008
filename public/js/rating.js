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
})();
