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

    slides[current].setAttribute("tabindex", "-1");
  }

  function goTo(index) {
    if (index < 0 || index > total - 1) return;
    current = index;
    render();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function bounce(btn) {
    btn.classList.remove("is-bouncing");
    // força reflow para poder reiniciar a animação
    void btn.offsetWidth;
    btn.classList.add("is-bouncing");
  }

  prevBtn.addEventListener("click", () => { bounce(prevBtn); prev(); });
  nextBtn.addEventListener("click", () => { bounce(nextBtn); next(); });

  // navegação por teclado
  window.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("is-open")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); bounce(nextBtn); next(); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); bounce(prevBtn); prev(); }
    if (e.key === "Home") { e.preventDefault(); goTo(0); }
    if (e.key === "End") { e.preventDefault(); goTo(total - 1); }
  });

  // navegação por clique na área do slide (metade direita avança, esquerda volta)
  document.getElementById("deck").addEventListener("click", (e) => {
    if (e.target.closest("a, button, .plant-card, .fauna-card, .flip-card, .toggle-btn")) return;
    const x = e.clientX;
    const half = window.innerWidth / 2;
    if (x > half) { bounce(nextBtn); next(); } else { bounce(prevBtn); prev(); }
  });

  // gestos de arraste / swipe (touch)
  let startX = null;
  let dragging = false;

  function dragStart(x) { startX = x; dragging = true; }
  function dragEnd(x) {
    if (!dragging || startX === null) return;
    const delta = x - startX;
    if (Math.abs(delta) > 60) {
      if (delta < 0) { bounce(nextBtn); next(); } else { bounce(prevBtn); prev(); }
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

  // contagem animada dos números (slide do domínio morfoclimático)
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
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  // parallax do relevo (slide "relevo e solo") — camadas se movem com o mouse
  const terrainVisual = document.getElementById("terrainVisual");
  if (terrainVisual) {
    const layers = Array.from(terrainVisual.querySelectorAll(".terrain-layer"));
    terrainVisual.addEventListener("mousemove", (e) => {
      const rect = terrainVisual.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 a 0.5
      layers.forEach((layer) => {
        const depth = parseFloat(layer.dataset.depth) || 10;
        layer.style.transform = "translateX(" + (relX * depth) + "px)";
      });
    });
    terrainVisual.addEventListener("mouseleave", () => {
      layers.forEach((layer) => { layer.style.transform = "translateX(0)"; });
    });
  }

  // alternância de painéis na slide de preservação
  const toggleBtns = Array.from(document.querySelectorAll(".toggle-btn"));
  const panels = Array.from(document.querySelectorAll("[data-panel-content]"));
  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.panel;
      toggleBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panelContent === target));
    });
  });

  // flip cards da slide de perguntas
  const flipCards = Array.from(document.querySelectorAll(".flip-card"));
  flipCards.forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("is-flipped"));
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.classList.toggle("is-flipped");
      }
    });
  });

  // lightbox — fotos reais escondidas atrás de botões
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxBackdrop = document.getElementById("lightboxBackdrop");

  function openLightbox(src, caption) {
    lightboxImg.src = src;
    lightboxImg.alt = caption || "";
    lightboxCaption.textContent = caption || "";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    lightboxClose.focus();
  }
  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
  }

  document.querySelectorAll(".photo-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openLightbox(btn.dataset.img, btn.dataset.caption);
    });
  });
  lightboxClose.addEventListener("click", closeLightbox);
  lightboxBackdrop.addEventListener("click", closeLightbox);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
  });

  render();
})();
