// menu detay sayfasi - dinamik fiyat hesaplama + qty + checkbox max limit
(function () {
  var form = document.getElementById('orderForm');
  if (!form) return;

  var basePrice = parseFloat(form.dataset.basePrice) || 0;
  var qtyInput = document.getElementById('quantity');
  var totalEl = document.getElementById('totalPrice');

  function getExtras() {
    var sum = 0;
    var checked = form.querySelectorAll('input[data-extra-price]:checked');
    for (var i = 0; i < checked.length; i++) {
      var v = parseFloat(checked[i].dataset.extraPrice) || 0;
      sum += v;
    }
    return sum;
  }

  function calculate() {
    var qty = parseInt(qtyInput.value, 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    if (qty > 20) qty = 20;
    qtyInput.value = qty;

    var total = (basePrice + getExtras()) * qty;
    totalEl.textContent = total.toFixed(2);
  }

  // checkbox grouplarinda max_select limiti
  function enforceMax(e) {
    var input = e.target;
    if (input.type !== 'checkbox') return;
    var groupId = input.dataset.group;
    var max = parseInt(input.dataset.max, 10);
    if (!groupId || !max) return;

    var groupBoxes = form.querySelectorAll('input[type="checkbox"][data-group="' + groupId + '"]');
    var checkedCount = 0;
    groupBoxes.forEach(function (b) { if (b.checked) checkedCount++; });

    if (checkedCount > max) {
      input.checked = false;
      alert('Bu grupta en fazla ' + max + ' seçim yapabilirsin');
    }
  }

  // qty + / -
  document.getElementById('qtyPlus').addEventListener('click', function () {
    qtyInput.value = Math.min(20, (parseInt(qtyInput.value, 10) || 1) + 1);
    calculate();
  });
  document.getElementById('qtyMinus').addEventListener('click', function () {
    qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
    calculate();
  });
  qtyInput.addEventListener('input', calculate);

  // tum option input'larina listener
  var inputs = form.querySelectorAll('input[data-extra-price], input[type="checkbox"][data-max]');
  inputs.forEach(function (inp) {
    inp.addEventListener('change', function (e) {
      enforceMax(e);
      calculate();
    });
  });

  calculate();
})();
