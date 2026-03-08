// ── Carousel ────────────────────────────────────────
(function() {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots   = document.querySelectorAll('.dot');
  let current  = 0;
  let timer;
  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }
  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }
  function startAuto() {
    timer = setInterval(next, 5000);
  }
  function resetAuto() {
    clearInterval(timer);
    startAuto();
  }
  document.querySelector('.carousel-arrow.next').addEventListener('click', () => { next(); resetAuto(); });
  document.querySelector('.carousel-arrow.prev').addEventListener('click', () => { prev(); resetAuto(); });
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.index));
      resetAuto();
    });
  });
  startAuto();
})();

// ── Unit Toggle ──────────────────────────────────────
const unitBtns = document.querySelectorAll(".unit-btn");
let currentUnit = "F";

unitBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.unit === currentUnit) return;

    unitBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const tempInput = document.getElementById("oven-temp");
    const currentVal = Number(tempInput.value);

    if (btn.dataset.unit === "C") {
      tempInput.value = fToC(currentVal);
      tempInput.min = 150;
      tempInput.max = 540;
    } else {
      tempInput.value = cToF(currentVal);
      tempInput.min = 300;
      tempInput.max = 1000;
    }

    currentUnit = btn.dataset.unit;
  });
});

// ── Dynamic Size Selector ────────────────────────────
const typeSelect = document.getElementById("pizza-type");
const sizeSelect = document.getElementById("pizza-size");

typeSelect.addEventListener("change", () => {
  const recipe = PIZZA_RECIPES[typeSelect.value];
  if (!recipe) return;

  sizeSelect.innerHTML = "";
  for (const [key, info] of Object.entries(recipe.sizes)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = info.label;
    sizeSelect.appendChild(opt);
  }

  // Default to middle option for round (12″), or half for sheet
  const keys = Object.keys(recipe.sizes);
  if (recipe.isSheet) {
    sizeSelect.value = keys.includes("half") ? "half" : keys[0];
  } else {
    sizeSelect.value = keys.includes("12") ? "12" : keys[0];
  }
});

// ── Form Submit ──────────────────────────────────────
document.getElementById("pizza-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const type = document.getElementById("pizza-type").value;
  const sizeKey = sizeSelect.value;
  const numPizzas = parseInt(document.getElementById("num-pizzas").value, 10);
  let ovenTemp = parseInt(document.getElementById("oven-temp").value, 10);

  if (!type || !sizeKey || !numPizzas || !ovenTemp) return;

  const ovenTempF = currentUnit === "C" ? cToF(ovenTemp) : ovenTemp;

  const recipe = PIZZA_RECIPES[type];
  if (!recipe) return;

  // ── Calculate ──
  const dough = calculateDough(recipe, numPizzas, sizeKey);
  const sauce = calculateSauce(recipe, numPizzas, sizeKey);
  const toppings = calculateToppings(recipe, numPizzas, sizeKey);
  const bakingInfo = getBakingInfo(recipe, ovenTempF);

  // ── Render title ──
  const sizeLabel = recipe.sizes[sizeKey].label;
  const unitLabel = recipe.isSheet ? "pan" : "pizza";
  const countLabel = numPizzas === 1 ? `1 ${unitLabel}` : `${numPizzas} ${unitLabel}s`;
  document.getElementById("result-title").textContent =
    `${recipe.name} — ${countLabel}`;

  document.getElementById("result-badge").textContent = sizeLabel;

  // Dough table — 3 columns: Ingredient | Grams | % of Flour
  fillTable("dough-table",
    dough.map((d) => [d.ingredient, `${d.amount} g`, `${d.pct}%`])
  );

  // Sauce table — all grams
  fillTable("sauce-table",
    sauce.map((s) => [s.ingredient, `${s.amount} g`])
  );

  // Toppings table — all grams
  fillTable("toppings-table",
    toppings.map((t) => [t.ingredient, `${t.amount} g`])
  );

  // Baking instructions
  const recTempDisplay =
    currentUnit === "C"
      ? `${fToC(bakingInfo.recommendedTemp)}°C`
      : `${bakingInfo.recommendedTemp}°F`;

  let tempNote = "";
  if (bakingInfo.tempCategory === "optimal") {
    tempNote = `Your oven is in the ideal range for ${recipe.name} pizza.`;
  } else if (bakingInfo.tempCategory === "moderate") {
    tempNote = `Your oven is a bit below ideal (${recipe.idealTemp.min}°F+), but you'll still get great results with a longer bake.`;
  } else {
    tempNote = `Your oven is well below ideal for ${recipe.name}. Consider using a pizza stone or steel to maximize heat retention. Bake longer and watch carefully.`;
  }

  document.getElementById("baking-instructions").innerHTML = `
    <p><strong>Preheat oven to:</strong> ${recTempDisplay} (preheat for at least 45 minutes)</p>
    <p><strong>Bake time:</strong> ${bakingInfo.bakeTime}</p>
    <p>${tempNote}</p>
  `;

  // Pro tips
  const tipsList = document.getElementById("pro-tips");
  tipsList.innerHTML = "";
  recipe.tips.forEach((tip) => {
    const li = document.createElement("li");
    li.textContent = tip;
    tipsList.appendChild(li);
  });

  // Show results
  const resultsEl = document.getElementById("results");
  resultsEl.classList.remove("hidden");
  resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
});

// ── Helpers ──────────────────────────────────────────
function fillTable(tableId, rows) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = "";
  rows.forEach((cols) => {
    const tr = document.createElement("tr");
    tr.innerHTML = cols.map((c) => `<td>${c}</td>`).join("");
    tbody.appendChild(tr);
  });
}
