var title = document.getElementById("weekTitle");
    var btnText = document.getElementById("btnText");
    var original = true;

    btnText.addEventListener("click", function () {
      if (original) {
        title.textContent = "Week 1 Â· HTML & CSS Page Layout";
      } else {
        title.textContent = "Week 1 Â· HTML & CSS Fundamentals";
      }
      original = !original;
    });

    var table = document.getElementsByClassName("gradeTable")[0];
    var sortBtn = document.getElementsByClassName("btnSort")[0];
    var ascending = true;
    var gradeOrder = {
      "AA": 8,
      "BA": 7,
      "BB": 6,
      "CB": 5,
      "CC": 4,
      "DC": 3,
      "DD": 2,
      "FF": 1
    };

    sortBtn.addEventListener("click", function () {
      var tbody = table.querySelector("tbody");
      var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));

      rows.sort(function (a, b) {
        var gradeA = a.querySelector(".grade").textContent.trim();
        var gradeB = b.querySelector(".grade").textContent.trim();
        var valA = gradeOrder[gradeA] || 0;
        var valB = gradeOrder[gradeB] || 0;
        return ascending ? valA - valB : valB - valA;
      });

      rows.forEach(function (row) {
        tbody.appendChild(row);
      });
      ascending = !ascending;
      sortBtn.textContent = ascending ? "Sort by Letter Grade â–²" : "Sort by Letter Grade â–¼";
    });

    var btnCalc = document.getElementById("btnCalc");

    btnCalc.addEventListener("click", function () {
      var rows = table.querySelectorAll("tbody tr");

      rows.forEach(function (row) {
        var mid = parseInt(row.querySelector(".midterm").value);
        var fin = parseInt(row.querySelector(".final").value);
        var avg = mid * 0.4 + fin * 0.6;
        var letter = "";

        if (avg >= 90) letter = "AA";
        else if (avg >= 85) letter = "BA";
        else if (avg >= 80) letter = "BB";
        else if (avg >= 75) letter = "CB";
        else if (avg >= 70) letter = "CC";
        else if (avg >= 65) letter = "DC";
        else if (avg >= 60) letter = "DD";
        else letter = "FF";

        row.querySelector(".grade").textContent = letter;
        row.setAttribute("data-avg", avg);
      });

      var tbody = table.querySelector("tbody");
      var rowsArray = Array.prototype.slice.call(rows);

      rowsArray.sort(function (a, b) {
        var gradeA = a.querySelector(".grade").textContent.trim();
        var gradeB = b.querySelector(".grade").textContent.trim();
        return (gradeOrder[gradeB] || 0) - (gradeOrder[gradeA] || 0);
      });

      rowsArray.forEach(function (r) {
        tbody.appendChild(r);
      });
    });

    var btnImg = document.getElementById("btnImg");
    var img = document.getElementsByClassName("mainImage")[0];
    var gallery = [
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644"
    ];
    var imgIndex = 0;

    btnImg.addEventListener("click", function () {
      imgIndex = (imgIndex + 1) % gallery.length;
      img.src = gallery[imgIndex];
    });

    var canvas = document.getElementById("particleCanvas");
    var ctx = canvas.getContext("2d");
    var particles = [];
    var ripples = [];
    var mouseInCanvas = false;
    var mx = 0, my = 0, prevMx = 0, prevMy = 0;
    var globalHue = 0;
    var orbitAngle = 0;

    function resizeCanvas() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    canvas.addEventListener("mousemove", function (e) {
      var r = canvas.getBoundingClientRect();
      prevMx = mx;
      prevMy = my;
      mx = (e.clientX - r.left) * (canvas.width / r.width);
      my = (e.clientY - r.top) * (canvas.height / r.height);
      mouseInCanvas = true;
      var speed = Math.sqrt((mx - prevMx) * (mx - prevMx) + (my - prevMy) * (my - prevMy));
      var count = Math.min(Math.floor(speed / 2) + 2, 8);
      for (var i = 0; i < count; i++) {
        var t = i / count;
        particles.push({
          x: prevMx + (mx - prevMx) * t,
          y: prevMy + (my - prevMy) * t,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 1,
          decay: 0.004 + Math.random() * 0.012,
          size: Math.random() * 5 + 1.5,
          hue: globalHue + Math.random() * 80 - 40,
          kind: Math.random()
        });
      }
      if (speed > 10) {
        ripples.push({ x: mx, y: my, radius: 5, maxRadius: 50 + speed * 2, life: 1, hue: globalHue });
      }
    });

    canvas.addEventListener("mouseleave", function () {
      mouseInCanvas = false;
    });

    function drawAnimation() {
      ctx.fillStyle = "rgba(10, 10, 46, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      globalHue = (globalHue + 0.4) % 360;
      orbitAngle += 0.02;

      for (var i = ripples.length - 1; i >= 0; i--) {
        var rp = ripples[i];
        rp.radius += (rp.maxRadius - rp.radius) * 0.05;
        rp.life -= 0.02;
        if (rp.life <= 0) { ripples.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "hsla(" + rp.hue + ",100%,70%," + (rp.life * 0.4) + ")";
        ctx.lineWidth = 2 * rp.life;
        ctx.stroke();
      }

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        if (mouseInCanvas) {
          var dx = mx - p.x, dy = my - p.y;
          var d = Math.sqrt(dx * dx + dy * dy) + 1;
          if (d < 150) {
            p.vx += dx / d * 0.15;
            p.vy += dy / d * 0.15;
          }
        }
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }

        var alpha = p.life;
        if (p.kind > 0.75) {
          var ringR = p.size * (1 - p.life) * 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = "hsla(" + p.hue + ",100%,70%," + (alpha * 0.7) + ")";
          ctx.lineWidth = 1.5 * p.life;
          ctx.stroke();
        } else if (p.kind > 0.5) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.life * Math.PI * 2);
          var s = p.size * p.life * 1.5;
          ctx.fillStyle = "hsla(" + (p.hue + 30) + ",100%,65%," + alpha + ")";
          ctx.fillRect(-s / 2, -s / 2, s, s);
          ctx.restore();
        } else {
          var cr = p.size * p.life;
          ctx.beginPath();
          ctx.arc(p.x, p.y, cr, 0, Math.PI * 2);
          ctx.fillStyle = "hsla(" + p.hue + ",100%,60%," + alpha + ")";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x, p.y, cr * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "hsla(" + p.hue + ",100%,70%," + (alpha * 0.15) + ")";
          ctx.fill();
        }

        for (var j = i - 1; j >= Math.max(0, i - 15); j--) {
          var p2 = particles[j];
          var lx = p.x - p2.x, ly = p.y - p2.y;
          var ld = Math.sqrt(lx * lx + ly * ly);
          if (ld < 70) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = "hsla(" + ((p.hue + p2.hue) / 2) + ",100%,60%," + ((1 - ld / 70) * Math.min(p.life, p2.life) * 0.25) + ")";
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      if (mouseInCanvas) {
        var pulse = 20 + Math.sin(Date.now() * 0.004) * 6;
        for (var k = 0; k < 3; k++) {
          var angle = orbitAngle + (k * Math.PI * 2 / 3);
          var ox = mx + Math.cos(angle) * pulse;
          var oy = my + Math.sin(angle) * pulse;
          ctx.beginPath();
          ctx.arc(ox, oy, 3, 0, Math.PI * 2);
          ctx.fillStyle = "hsla(" + (globalHue + k * 120) + ",100%,70%,0.8)";
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(ox, oy);
          ctx.strokeStyle = "hsla(" + (globalHue + k * 120) + ",100%,70%,0.3)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        var grad = ctx.createRadialGradient(mx, my, 0, mx, my, 40);
        grad.addColorStop(0, "hsla(" + globalHue + ",100%,70%,0.2)");
        grad.addColorStop(1, "hsla(" + globalHue + ",100%,70%,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mx, my, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      if (particles.length > 600) particles.splice(0, particles.length - 600);
      requestAnimationFrame(drawAnimation);
    }
    drawAnimation();
