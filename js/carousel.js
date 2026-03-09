/* ── Hero Carousel ─────────────────────────────────── */
(() => {
  const slides = document.querySelectorAll(".carousel-slide");
  const dots   = document.querySelectorAll(".carousel-dots .dot");
  if (!slides.length) return;

  let current = 0;
  const total = slides.length;

  function goTo(i) {
    slides[current].classList.remove("active");
    dots[current]?.classList.remove("active");
    current = (i + total) % total;
    slides[current].classList.add("active");
    dots[current]?.classList.add("active");
  }

  setInterval(() => goTo(current + 1), 5000);
  document.querySelector(".carousel-arrow.next")?.addEventListener("click", () => goTo(current + 1));
  document.querySelector(".carousel-arrow.prev")?.addEventListener("click", () => goTo(current - 1));
  dots.forEach(d =>
    d.addEventListener("click", () => goTo(parseInt(d.dataset.index, 10)))
  );
})();
