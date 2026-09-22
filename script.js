(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  const dotsWrap = document.getElementById("dots");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const progressFill = document.getElementById("progressFill");

  let current = 0;
  const countedSlides = new Set();

  // cria os pontos de navegação
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "dot";
    dot.type = "button";
    dot.setAttribute("aria-label", "Ir para o slide " + (i + 1));
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function render() {
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === current);
      slide.classList.toggle("is-prev", i < current);
    });
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === current));

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;

    progressFill.style.width = ((current + 1) / total) * 100 + "%";

    maybeAnimateCounters();

    // devolve o foco ao container ativo para leitores de tela
    slides[current].setAttribute("tabindex", "-1");
  }

  function goTo(index) {
    if (index < 0 || index > total - 1) return;
    current = index;
    render();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  // navegação por teclado
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); next(); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
    if (e.key === "Home") { e.preventDefault(); goTo(0); }
    if (e.key === "End") { e.preventDefault(); goTo(total - 1); }
  });

  // navegação por clique na área do slide (metade direita avança, esquerda volta)
  document.getElementById("deck").addEventListener("click", (e) => {
    if (e.target.closest("a, button, .plant-card, .fauna-card")) return;
    const x = e.clientX;
    const half = window.innerWidth / 2;
    if (x > half) next(); else prev();
  });

  // gestos de arraste / swipe (touch e mouse)
  let startX = null;
  let dragging = false;

  function dragStart(x) { startX = x; dragging = true; }
  function dragEnd(x) {
    if (!dragging || startX === null) return;
    const delta = x - startX;
    if (Math.abs(delta) > 60) {
      if (delta < 0) next(); else prev();
    }
    dragging = false;
    startX = null;
  }

  document.getElementById("deck").addEventListener("touchstart", (e) => {
    dragStart(e.touches[0].clientX);
  }, { passive: true });
  document.getElementById("deck").addEventListener("touchend", (e) => {
    dragEnd(e.changedTouches[0].clientX);
  });

  // contagem animada dos números da slide de clima
  function maybeAnimateCounters() {
    const activeSlide = slides[current];
    if (countedSlides.has(current)) return;
    const numbers = activeSlide.querySelectorAll(".stat-number[data-count]");
    if (!numbers.length) return;

    countedSlides.add(current);
    numbers.forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const duration = 900;
      const start = performance.now();

      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cúbico
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  render();
})();
