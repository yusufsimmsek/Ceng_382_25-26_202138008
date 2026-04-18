(function () {
    const form = document.getElementById('orderForm');
    if (!form) return;

    const basePrice = parseFloat(form.dataset.basePrice || '0');
    const qtyInput = document.getElementById('qtyInput');
    const totalEl = document.getElementById('totalPrice');

    function calculate() {
        let qty = parseInt(qtyInput.value);
        if (isNaN(qty) || qty < 1) qty = 1;

        let extras = 0;
        form.querySelectorAll('input[type="radio"]:checked').forEach(function (el) {
            extras += parseFloat(el.dataset.extraPrice || '0');
        });
        form.querySelectorAll('input[type="checkbox"][name="options"]:checked').forEach(function (el) {
            extras += parseFloat(el.dataset.extraPrice || '0');
        });

        const total = (basePrice + extras) * qty;
        totalEl.textContent = total.toFixed(2);
    }

    // Adet butonları
    form.querySelectorAll('.qty-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const action = btn.dataset.action;
            let v = parseInt(qtyInput.value);
            if (isNaN(v)) v = 1;
            if (action === 'increase' && v < 20) v++;
            else if (action === 'decrease' && v > 1) v--;
            qtyInput.value = v;
            calculate();
        });
    });

    // Tüm input değişikliklerinde recalc
    form.querySelectorAll('input').forEach(function (el) {
        el.addEventListener('change', calculate);
    });
    qtyInput.addEventListener('input', calculate);

    // Checkbox grubu max kontrol
    form.querySelectorAll('input[type="checkbox"][data-group-id]').forEach(function (el) {
        el.addEventListener('change', function () {
            const groupId = el.dataset.groupId;
            const max = parseInt(el.dataset.max || '99');
            const checked = form.querySelectorAll(
                'input[type="checkbox"][data-group-id="' + groupId + '"]:checked'
            ).length;
            if (checked > max) {
                el.checked = false;
                alert('Bu grupta en fazla ' + max + ' seçim yapabilirsin');
                calculate();
            }
        });
    });

    calculate();
})();
