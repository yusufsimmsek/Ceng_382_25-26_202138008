(function () {
    document.querySelectorAll('.star-rating').forEach(function (group) {
        var target = group.dataset.target;
        var input = document.getElementById(target);
        var label = document.getElementById(target + 'Label');
        var stars = group.querySelectorAll('.star');
        var labels = ['', 'Çok kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];
        var currentValue = 0;

        function fill(n) {
            stars.forEach(function (s, idx) {
                if (idx < n) s.classList.add('filled');
                else s.classList.remove('filled');
            });
        }

        stars.forEach(function (star) {
            star.addEventListener('mouseenter', function () {
                fill(parseInt(star.dataset.value));
            });
            star.addEventListener('click', function () {
                currentValue = parseInt(star.dataset.value);
                input.value = currentValue;
                fill(currentValue);
                if (label) label.textContent = labels[currentValue];
            });
        });

        group.addEventListener('mouseleave', function () {
            fill(currentValue);
        });
    });

    var form = document.querySelector('form[action*="/Rate"]');
    if (form) {
        form.addEventListener('submit', function (e) {
            var m = document.getElementById('MenuRating').value;
            var c = document.getElementById('CatererRating').value;
            if (m === '0' || c === '0') {
                e.preventDefault();
                alert('Lütfen iki bölüm için de puan ver');
            }
        });
    }
})();
