/* ── Hero Carousel ─────────────────────────────────── */
(() => {
  const slides = document.querySelectorAll(".carousel-slide");
  const dots   = document.querySelectorAll(".carousel-dots .dot");
  if (!slides.length) return;

  let current = 0;
  const total = slides.length;
  let autoTimer = null;

  function goTo(i) {
    slides[current].classList.remove("active");
    dots[current]?.classList.remove("active");
    current = (i + total) % total;
    slides[current].classList.add("active");
    dots[current]?.classList.add("active");
  }

  function resetAutoplay() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }

  resetAutoplay();

  document.querySelector(".carousel-arrow.next")?.addEventListener("click", () => {
    goTo(current + 1);
    resetAutoplay();
  });
  document.querySelector(".carousel-arrow.prev")?.addEventListener("click", () => {
    goTo(current - 1);
    resetAutoplay();
  });
  dots.forEach(d =>
    d.addEventListener("click", () => {
      goTo(parseInt(d.dataset.index, 10));
      resetAutoplay();
    })
  );

  // ── Splash page: clicking a slide navigates to calculator ──
  if (document.body.classList.contains("splash-page")) {
    slides.forEach(slide => {
      slide.style.cursor = "pointer";
      slide.addEventListener("click", () => {
        const style = slide.dataset.style;
        if (style) {
          window.location.href = "calculator.html?style=" + encodeURIComponent(style);
        }
      });
    });
  }
})();
