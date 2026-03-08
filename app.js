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

// ── Form Submit ──────────────────────────────────────
document.getElementById("pizza-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const type = document.getElementById("pizza-type").value;
  const numPizzas = parseInt(document.getElementById("num-pizzas").value, 10);
  let ovenTemp = parseInt(document.getElementById("oven-temp").value, 10);

  if (!type || !numPizzas || !ovenTemp) return;

  // Convert to °F internally
  const ovenTempF = currentUnit === "C" ? cToF(ovenTemp) : ovenTemp;

  const recipe = PIZZA_RECIPES[type];
  if (!recipe) return;

  // ── Calculate ──
  const dough = calculateDough(recipe, numPizzas);
  const sauce = calculateSauce(recipe, numPizzas);
  const bakingInfo = getBakingInfo(recipe, ovenTempF);

  // ── Render ──
  document.getElementById("result-title").textContent =
    `${recipe.name} — ${numPizzas} Pizza${numPizzas > 1 ? "s" : ""}`;

  const badgeEl = document.getElementById("result-badge");
  badgeEl.textContent = recipe.diameter;

  // Dough table
  fillTable("dough-table", dough.map((d) => [d.ingredient, `${d.amount} ${d.unit}`]));

  // Sauce table
  fillTable("sauce-table", sauce.map((s) => [s.ingredient, `${s.amount} ${s.unit}`]));

  // Toppings table
  fillTable(
    "toppings-table",
    recipe.toppings.map((t) => [t.ingredient, t.amount])
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
  rows.forEach(([col1, col2]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${col1}</td><td>${col2}</td>`;
    tbody.appendChild(tr);
  });
}
